import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { useThemeMode } from '../theme';
import { mediumScreen } from '../types';

type SubscriptionItem = {
  id: string;
  name: string;
  price: string;
  billingCycle: string;
  nextBill: string;
  img: string;
  borderColor: string;
  backgroundColor: string;
  perks: string[];
};

const subscriptions: SubscriptionItem[] = [
  {
    id: '1',
    name: 'Elena Rose',
    price: '$49.99',
    billingCycle: 'Monthly',
    nextBill: 'Sep 12, 2024',
    img: 'https://picsum.photos/seed/elena/150',
    borderColor: 'rgba(234,179,8,0.35)',
    backgroundColor: 'rgba(234,179,8,0.06)',
    perks: ['1:1 Live Monthly', 'All Premium Access'],
  },
  {
    id: '2',
    name: 'Zion King',
    price: '$14.99',
    billingCycle: 'Monthly',
    nextBill: 'Sep 15, 2024',
    img: 'https://picsum.photos/seed/zion/150',
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(148,163,184,0.06)',
    perks: ['Monthly BTS', 'Standard Premium'],
  },
  {
    id: '3',
    name: 'Amara',
    price: '$4.99',
    billingCycle: 'Monthly',
    nextBill: 'Oct 01, 2024',
    img: 'https://picsum.photos/seed/amara/150',
    borderColor: 'rgba(234,88,12,0.35)',
    backgroundColor: 'rgba(234,88,12,0.06)',
    perks: ['Feed Exclusives'],
  },
];

const FanSubscriptions: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  const titleColor = isDark ? '#fff' : theme.text;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#6b7280' : theme.textMuted;
  const softBg = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : theme.card;
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;

  const handleManage = (sub: SubscriptionItem) => {
    setSelectedSub(sub);
    setIsManaging(true);
  };

  const handleCancel = () => {
    if (!selectedSub) return;
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your subscription to ${selectedSub.name}?`,
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Subscription Cancelled',
              'You will have access until the end of the billing period.',
            );
            setIsManaging(false);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.screen }]}>
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(6,9,19,0.94)' : 'rgba(255,255,255,0.96)', borderBottomColor: border }]}>
        <View style={s.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={[s.headerButton, { backgroundColor: softBg, borderColor: border }]}>
            <MaterialIcons name="arrow-back" size={20} color={titleColor} />
          </Pressable>
          <Text style={[s.headerTitle, { color: titleColor }]}>Active Support</Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{subscriptions.length} Active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: 24 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {subscriptions.map((sub) => (
          <View
            key={sub.id}
            style={[
              s.subscriptionCard,
              {
                borderColor: sub.borderColor,
                backgroundColor: isDark ? sub.backgroundColor : theme.card,
              },
            ]}
          >
            <View style={s.cardGlow} />
            <View style={s.subscriptionHeader}>
              <View style={s.avatarWrap}>
                <Image source={{ uri: sub.img }} style={s.avatar} />
              </View>
              <View style={s.subscriptionHeaderText}>
                <View style={s.nameRow}>
                  <Text style={[s.name, { color: titleColor }]}>{sub.name}</Text>
                  <MaterialIcons name="verified" size={16} color="#cd2bee" />
                </View>
                <View style={[s.planChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : softBg }]}>
                  <Text style={[s.planChipText, { color: subtle }]}>{sub.billingCycle} Membership</Text>
                </View>
              </View>
            </View>

            <View style={s.perksSection}>
              <Text style={[s.microLabel, { color: muted }]}>Unlocked Perks</Text>
              <View style={s.perksWrap}>
                {sub.perks.map((perk) => (
                  <View key={perk} style={[s.perkChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : softBg, borderColor: border }]}>
                    <Text style={[s.perkText, { color: subtle }]}>{`\u2022 ${perk}`}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[s.billingGrid, { borderTopColor: border }]}>
              <View>
                <Text style={[s.microLabel, { color: muted }]}>Next Renewal</Text>
                <Text style={[s.billingValue, { color: titleColor }]}>{sub.nextBill}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.microLabel, { color: muted }]}>Monthly Cost</Text>
                <Text style={s.priceValue}>{sub.price}</Text>
              </View>
            </View>

            <View style={s.actionsRow}>
              <Pressable onPress={() => navigation.navigate('ArtistProfile', { id: sub.name })} style={s.visitButton}>
                <Text style={s.visitButtonText}>Visit Hub</Text>
              </Pressable>
              <Pressable onPress={() => handleManage(sub)} style={[s.manageButton, { backgroundColor: softBg, borderColor: border }]}>
                <Text style={[s.manageButtonText, { color: subtle }]}>Manage</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={s.footerCta}>
          <View style={[s.footerIconWrap, { backgroundColor: softBg }]}>
            <MaterialIcons name="add-circle" size={30} color={muted} />
          </View>
          <Pressable onPress={() => navigation.navigate('Explore')}>
            <Text style={s.discoverText}>Discover new creators to support</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal 
      statusBarTranslucent
      visible={isManaging && !!selectedSub} animationType="slide" transparent onRequestClose={() => setIsManaging(false)}>
        <View style={s.modalRoot}>
          <Pressable style={s.modalBackdrop} onPress={() => setIsManaging(false)} />
          {selectedSub ? (
            <View style={[s.modalCard, { backgroundColor: theme.background, borderColor: border, paddingBottom: Math.max(20, insets.bottom) }]}>
              <View style={[s.handle, { backgroundColor: border }]} />

              <View style={s.modalHeader}>
                <View style={s.modalAvatarWrap}>
                  <Image source={{ uri: selectedSub.img }} style={s.modalAvatar} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modalTitle, { color: titleColor }]}>{selectedSub.name}</Text>
                  <Text style={s.modalMeta}>{selectedSub.billingCycle} Member</Text>
                </View>
              </View>

              <View style={[s.planSummary, { backgroundColor: softBg, borderColor: border }]}>
                <View style={s.planSummaryRow}>
                  <Text style={[s.microLabel, { color: muted }]}>Current Plan</Text>
                  <Text style={s.priceValue}>{selectedSub.price}/mo</Text>
                </View>
                <View style={[s.divider, { backgroundColor: border }]} />
                <View style={s.planSummaryRow}>
                  <Text style={[s.microLabel, { color: muted }]}>Next Charge</Text>
                  <Text style={[s.billingValue, { color: titleColor }]}>{selectedSub.nextBill}</Text>
                </View>
              </View>

              <View style={s.modalSection}>
                <Text style={[s.microLabel, { color: muted }]}>Subscription Actions</Text>
                <Pressable onPress={() => navigation.navigate('Chat')} style={[s.actionCard, { backgroundColor: softBg, borderColor: border }]}>
                  <View style={s.actionLeft}>
                    <MaterialIcons name="chat" size={20} color="#cd2bee" />
                    <Text style={[s.actionText, { color: titleColor }]}>Message Creator</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={muted} />
                </Pressable>
              </View>

              <Pressable onPress={handleCancel} style={s.cancelSubscriptionButton}>
                <Text style={s.cancelSubscriptionText}>Cancel Subscription</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(18) : fontScale(14),
    textTransform: 'uppercase',
  },
  headerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(205,43,238,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.28)',
  },
  headerBadgeText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  content: {
    padding: 16,
    gap: 18,
  },
  subscriptionCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    gap: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  subscriptionHeaderText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(20) : fontScale(16),
  },
  planChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  planChipText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(9) : fontScale(7),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  perksSection: {
    gap: 10,
  },
  microLabel: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(9) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  perksWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  perkChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  perkText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8),
  },
  billingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  billingValue: {
    marginTop: 4,
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(12) : fontScale(10),
  },
  priceValue: {
    marginTop: 4,
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(14) : fontScale(12),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visitButton: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  manageButton: {
    flex: 1,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  footerCta: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 16,
    gap: 18,
  },
  footerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverText: {
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 20,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalAvatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(22) : fontScale(18),
    textTransform: 'uppercase',
  },
  modalMeta: {
    marginTop: 4,
    color: '#cd2bee',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(9) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  planSummary: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  planSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    height: 1,
  },
  modalSection: {
    gap: 12,
  },
  actionCard: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(12) : fontScale(10),
  },
  cancelSubscriptionButton: {
    marginTop: 6,
    marginBottom: 8,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSubscriptionText: {
    color: '#ef4444',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(10) : fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default FanSubscriptions;
