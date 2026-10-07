import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';

type PolicyTab = 'terms' | 'community' | 'commerce';

type TermsPoliciesRouteParams = {
  onboarding?: boolean;
  nextRoute?: 'VibePicker';
};

const TERMS_VERSION = '2026-06-08';
const TERMS_ACCEPTANCE_KEY = 'kulsah_terms_acceptance';

const tabs: Array<{ id: PolicyTab; label: string }> = [
  { id: 'terms', label: 'Terms' },
  { id: 'community', label: 'Guidelines' },
  { id: 'commerce', label: 'Commerce' },
];

const termsSections = [
  {
    section: '1. Member Node Registration',
    details:
      'Your profile registration marks you as an active stakeholder node. You are responsible for all stream broadcasts and financial micro-exchanges conducted under your cryptographic handle alias.',
  },
  {
    section: '2. Creative Freedom and Property Rights',
    details:
      'Creators retain whole ownership rights over original compositions, live recordings, and visual art uploaded in vault galleries. You grant Kulsah a limited, non-exclusive license to format, compress, and deliver these assets to active fan nodes.',
  },
  {
    section: '3. Challenge Transmissions',
    details:
      'Fans joining creator challenges must upload authentic multimedia content. Using auto-generated spam, scraper bots, or synthetic plagiarisms to farm prize rewards will lead to instant node quarantine.',
  },
  {
    section: '4. Limitation of Operational Liability',
    details:
      'Kulsah delivers decentralized networking portals. We are not liable for direct, physical, or speculative losses resulting from real-world event cancellations, ticket scalping, or unstable networking relays.',
  },
];

const guidelineCards: Array<{
  badge: string;
  title: string;
  desc: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  {
    badge: 'Harm Suppression',
    title: 'Harassment & Abuse Filters',
    desc:
      'Hate speech, personal doxxing, structural spamming, or explicit harassment of other artists and listeners will cause immediate coordinate termination.',
    icon: 'shield',
  },
  {
    badge: 'Authenticity Guarantee',
    title: 'Intellectual Theft Suppression',
    desc:
      'Our recommendation algorithm rewards true craft. Do not pose as other artists, play copyrighted media you do not navigate rights for, or spoof entry tickets.',
    icon: 'copyright',
  },
  {
    badge: 'Decent Broadcasting',
    title: 'Safe Livestreaming Rules',
    desc:
      'Sensationalism, extreme violence, or explicit material is banned from public livestreaming feeds. Violations trigger automatic emergency stream cutoff mechanisms.',
    icon: 'videocam-off',
  },
];

const commerceGroups = [
  {
    topic: 'KulCoins Exchange Terms',
    rules: [
      'Coins purchased in the Marketplace are non-refundable once distributed or gifted.',
      'Coins carry no interest and hold exclusive transactional value inside the Kulsah galaxy.',
    ],
  },
  {
    topic: 'Creator Payout Architecture',
    rules: [
      'Payments generated from subscriptions and ticket sales are subjected to a standardized 15% system platform fee to support low-latency streaming infrastructure.',
      'Withdrawals to connected accounts are processed semi-weekly once achieving a minimum threshold of $50 equivalent.',
    ],
  },
  {
    topic: 'Chargebacks & Refund Safeguards',
    rules: [
      'In the event of a canceled live performance, ticket holders are issued auto-refund credits in KulCoins equivalent to their initial gate entry keys price.',
      'Fraudulent payment behavior will prompt instant account locking.',
    ],
  },
];

const TermsPolicies: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<PolicyTab>('terms');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isSavingAcceptance, setIsSavingAcceptance] = useState(false);
  const params = (route.params ?? {}) as TermsPoliciesRouteParams;
  const isOnboarding = params.onboarding === true;

  const surface = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const softSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const cardSurface = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const muted = isDark ? 'rgba(255,255,255,0.36)' : theme.textMuted;
  const secondary = isDark ? 'rgba(255,255,255,0.62)' : theme.textSecondary;

  const handleAcceptAndContinue = async () => {
    if (!hasAccepted || isSavingAcceptance) return;

    setIsSavingAcceptance(true);
    try {
      await AsyncStorage.setItem(
        TERMS_ACCEPTANCE_KEY,
        JSON.stringify({ version: TERMS_VERSION, acceptedAt: new Date().toISOString() })
      );
      // This is an onboarding boundary: discard the policy screen from the
      // back stack and enter the requested onboarding destination exactly once.
      // Using reset also avoids returning to Terms after the user picks vibes.
      const destination = params.nextRoute ?? 'VibePicker';
      navigation.reset({
        index: 0,
        routes: [{ name: destination, params: { firstSignIn: true } }],
      });
    } finally {
      setIsSavingAcceptance(false);
    }
  };

  const renderTerms = () => (
    <View style={styles.tabContent}>
      <View style={styles.titleBlock}>
        <Text style={[styles.contentTitle, { color: theme.text }]}>Ecosystem Agreement</Text>
        <Text style={[styles.contentMeta, { color: muted }]}>Effective Date: June 8, 2026</Text>
      </View>

      <Text style={[styles.leadText, { color: secondary }]}>
        Welcome to the Kulsah digital workspace. By entering our stream chambers, purchasing KulCoins, or orchestrating interactive challenge orbits, you sign and confirm your compliance with our decentralized governing code.
      </Text>

      <View style={styles.cardList}>
        {termsSections.map((item) => (
          <View key={item.section} style={[styles.policyCard, { backgroundColor: cardSurface, borderColor: border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.section}</Text>
            <Text style={[styles.cardBody, { color: secondary }]}>{item.details}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCommunity = () => (
    <View style={styles.tabContent}>
      <View style={styles.titleBlock}>
        <Text style={[styles.contentTitle, { color: theme.text }]}>Galaxy Safety Blueprint</Text>
        <Text style={[styles.contentMeta, { color: muted }]}>Strict Moderation Policies</Text>
      </View>

      <Text style={[styles.leadText, { color: secondary }]}>
        We cultivate a stellar platform where indie composers, digital artists, and fan communities thrive together. Maintain cosmic decency inside chats, forum grids, and live broadcasts.
      </Text>

      <View style={styles.cardList}>
        {guidelineCards.map((card) => (
          <View key={card.title} style={[styles.policyCard, { backgroundColor: cardSurface, borderColor: border }]}>
            <View style={[styles.badge, { backgroundColor: primaryColorAlpha(0.1), borderColor: primaryColorAlpha(0.18) }]}>
              <Text style={styles.badgeText}>{card.badge}</Text>
            </View>
            <View style={styles.guidelineRow}>
              <View style={[styles.guidelineIcon, { backgroundColor: softSurface }]}>
                <MaterialIcons name={card.icon} size={18} color={muted} />
              </View>
              <View style={styles.guidelineCopy}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{card.title}</Text>
                <Text style={[styles.cardBody, { color: secondary }]}>{card.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCommerce = () => (
    <View style={styles.tabContent}>
      <View style={styles.titleBlock}>
        <Text style={[styles.contentTitle, { color: theme.text }]}>Commerce & Token Protocol</Text>
        <Text style={[styles.contentMeta, { color: muted }]}>Financial Guidelines</Text>
      </View>

      <Text style={[styles.leadText, { color: secondary }]}>
        We empower creators to generate sustainable income. Review terms on KulCoins tokenomics, ticket sales, subscription packages, and banking payouts.
      </Text>

      <View style={styles.cardList}>
        {commerceGroups.map((group) => (
          <View key={group.topic} style={[styles.policyCard, { backgroundColor: cardSurface, borderColor: border }]}>
            <Text style={styles.commerceTitle}>{group.topic}</Text>
            <View style={styles.ruleList}>
              {group.rules.map((rule) => (
                <View key={rule} style={styles.ruleRow}>
                  <MaterialIcons name="done" size={15} color={PRIMARY_COLOR} />
                  <Text style={[styles.ruleText, { color: secondary }]}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(6,9,19,0.94)' : 'rgba(255,255,255,0.94)', borderBottomColor: border }]}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: softSurface }]}
            >
              <MaterialIcons name="chevron-left" size={22} color={theme.text} />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {isOnboarding ? 'Terms & Conditions' : 'Terms & Policies'}
            </Text>
            {/* <Text style={[styles.headerSubtitle, { color: muted }]}>Ecosystem Charter</Text> */}
          </View>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: primaryColorAlpha(0.12) }]}>
          <MaterialIcons name="gavel" size={22} color={PRIMARY_COLOR} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.tabsWrap, { backgroundColor: softSurface, borderColor: border }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabButton, { backgroundColor: isActive ? PRIMARY_COLOR : 'transparent' }]}
              >
                <Text style={[styles.tabText, { color: isActive ? '#ffffff' : muted }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'terms' ? renderTerms() : activeTab === 'community' ? renderCommunity() : renderCommerce()}

        <View style={[styles.registryCard, { borderColor: border }]}>
          <Text style={[styles.registryTitle, { color: muted }]}>Legal Governance Registry</Text>
          <Text style={[styles.registryBody, { color: isDark ? 'rgba(255,255,255,0.35)' : theme.textMuted }]}>
            Node code last compiled June 2026. Submitting transactions or broadcasting streams conforms to this compiled revision.
          </Text>
        </View>

        {isOnboarding ? (
          <View style={[styles.acceptanceCard, { backgroundColor: cardSurface, borderColor: border }]}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasAccepted }}
              accessibilityLabel="Accept the Terms and Conditions"
              onPress={() => setHasAccepted((current) => !current)}
              style={styles.acceptanceRow}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: hasAccepted ? PRIMARY_COLOR : border },
                  hasAccepted && styles.checkboxChecked,
                ]}
              >
                {hasAccepted ? <MaterialIcons name="done" size={17} color="#ffffff" /> : null}
              </View>
              <Text style={[styles.acceptanceText, { color: secondary }]}>
                I have read and agree to Kulsah&apos;s Terms and Conditions, Community Guidelines, and Commerce terms.
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!hasAccepted || isSavingAcceptance}
              onPress={() => void handleAcceptAndContinue()}
              style={[
                styles.acceptButton,
                (!hasAccepted || isSavingAcceptance) && styles.acceptButtonDisabled,
              ]}
            >
              {isSavingAcceptance ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept and continue</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 42,
    paddingHorizontal: 20,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    ...fontSize.h1,
    lineHeight: fontSize.h1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    marginTop: 2,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  tabsWrap: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  tabContent: {
    gap: 20,
  },
  titleBlock: {
    gap: 4,
  },
  contentTitle: {
    ...fontSize.b2,
    lineHeight: fontSize.b2.lineHeight,
    textTransform: 'uppercase',
  },
  contentMeta: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  leadText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  cardList: {
    gap: 14,
  },
  policyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    ...fontSize.b4,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  cardBody: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: PRIMARY_COLOR,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guidelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelineCopy: {
    flex: 1,
    gap: 4,
  },
  commerceTitle: {
    color: PRIMARY_COLOR,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  ruleList: {
    gap: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  ruleText: {
    flex: 1,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  registryCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  registryTitle: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  registryBody: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  acceptanceCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 18,
  },
  acceptanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_COLOR,
  },
  acceptanceText: {
    flex: 1,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  acceptButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  acceptButtonDisabled: {
    opacity: 0.4,
  },
  acceptButtonText: {
    color: '#ffffff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
});

export default TermsPolicies;
