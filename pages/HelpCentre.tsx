import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { fontSize } from './typography';

type FAQCategory = 'account' | 'coins' | 'orbit' | 'safety';
type ActiveCategory = 'all' | FAQCategory;

interface FAQ {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 'faq1',
    category: 'account',
    question: 'How do I switch between Fan and Creator modes?',
    answer:
      "You can transition instantly from the Cockpit (Settings) area. Simply tap 'Switch to Creator' or 'Switch to Fan' to swap your interface. Your accumulated KulCoins and digital credentials transition with you dynamically.",
  },
  {
    id: 'faq2',
    category: 'coins',
    question: 'What are KulCoins and how do I use them?',
    answer:
      "KulCoins are the native ecosystem fuel of Kulsah. Use them to purchase live event entry keys, unlock exclusive vault media archive drops, send digital gifts, or subscribe to your favorite creators' premium tiers.",
  },
  {
    id: 'faq3',
    category: 'orbit',
    question: 'What is an Active Orbit and how do I join challenges?',
    answer:
      'Active Orbits represent live interactive fan-creator challenges. Creators publish creative sheets, and fans join by submitting customized text, video, or audio entries before the countdown timer expires.',
  },
  {
    id: 'faq4',
    category: 'safety',
    question: 'How are my broadcast signals secured?',
    answer:
      'All live streams and vault assets use integrated signal protection protocols. In Creator Shield mode, screenshots and screen recordings are suppressed to safeguard exclusive contents and private live streams.',
  },
  {
    id: 'faq5',
    category: 'account',
    question: 'What is the Identity Pass?',
    answer:
      'Your Digital Pass represents your official node credentials in the Kulsah galaxy. It acts as an animated ticket scanner containing encrypted dynamic authentication keys for gate scan entry at real-world events.',
  },
  {
    id: 'faq6',
    category: 'coins',
    question: 'How do creator payouts work on Kulsah?',
    answer:
      "Creators earn revenue via subscriptions, gate access tickets, and digital coin gifts. Payouts are computed dynamically and can be managed from the 'Payout Settings' terminal in your Settings hub.",
  },
];

const categories: Array<{ id: ActiveCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { id: 'all', label: 'All Topics', icon: 'grid-view' },
  { id: 'account', label: 'Node Details & Identity', icon: 'account-circle' },
  { id: 'coins', label: 'KulCoins & Commerce', icon: 'toll' },
  { id: 'orbit', label: 'Orbits & Challenges', icon: 'rocket-launch' },
  { id: 'safety', label: 'Safety & Shield', icon: 'security' },
];

const ticketCategories = ['General Inquiry', 'Account Access & Identity', 'KulCoins & Transactions', 'Stream or Signal Disruption'];

const HelpCentre: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState(ticketCategories[0]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [ticketId, setTicketId] = useState('0000');

  const filteredFAQs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesSearch =
        !normalizedQuery ||
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, searchQuery]);

  const handleSendTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketId(String(Math.floor(1000 + Math.random() * 9000)));
    setShowToast(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => setShowToast(false), 4000);
  };

  const surface = isDark ? '#12121a' : theme.card;
  const softSurface = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const glassSurface = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const muted = isDark ? 'rgba(255,255,255,0.42)' : theme.textMuted;
  const secondary = isDark ? 'rgba(255,255,255,0.64)' : theme.textSecondary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={[styles.header, { backgroundColor: isDark ? 'rgba(18,18,26,0.92)' : 'rgba(255,255,255,0.94)', borderBottomColor: border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerCopy}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Help Centre</Text>
              {/* <Text style={[styles.headerSubtitle, { color: muted }]}>Support & Protocol Docs</Text> */}
            </View>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: primaryColorAlpha(0.12) }]}>
            <MaterialIcons name="help-center" size={22} color={PRIMARY_COLOR} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchBlock}>
            <View style={[styles.searchWrap, { backgroundColor: surface, borderColor: border }]}>
              <MaterialIcons name="search" size={21} color={muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search help topics, FAQs..."
                placeholderTextColor={muted}
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                  <MaterialIcons name="close" size={19} color={muted} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: muted }]}>Browse Database</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              {categories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setActiveCategory(category.id)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive ? PRIMARY_COLOR : glassSurface,
                        borderColor: isActive ? PRIMARY_COLOR : border,
                      },
                    ]}
                  >
                    <MaterialIcons name={category.icon} size={15} color={isActive ? '#ffffff' : secondary} />
                    <Text style={[styles.categoryText, { color: isActive ? '#ffffff' : secondary }]}>{category.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionLabel, { color: muted }]}>Frequently Asked Questions</Text>
              <Text style={styles.articleCount}>{filteredFAQs.length} Articles</Text>
            </View>

            {filteredFAQs.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: glassSurface, borderColor: border }]}>
                <MaterialIcons name="search-off" size={40} color={muted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No matches found</Text>
                <Text style={[styles.emptyBody, { color: muted }]}>Try searching different nodes or clear the search query.</Text>
              </View>
            ) : (
              <View style={styles.faqList}>
                {filteredFAQs.map((faq) => {
                  const isOpen = expandedId === faq.id;
                  return (
                    <View key={faq.id} style={[styles.faqCard, { backgroundColor: glassSurface, borderColor: isOpen ? primaryColorAlpha(0.32) : border }]}>
                      <Pressable onPress={() => setExpandedId(isOpen ? null : faq.id)} style={styles.faqButton}>
                        <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
                        <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={24} color={isOpen ? PRIMARY_COLOR : muted} />
                      </Pressable>
                      {isOpen ? (
                        <View style={[styles.faqAnswerWrap, { borderTopColor: border }]}>
                          <Text style={[styles.faqAnswer, { color: secondary }]}>{faq.answer}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={[styles.supportCard, { backgroundColor: isDark ? primaryColorAlpha(0.1) : primaryColorAlpha(0.06), borderColor: primaryColorAlpha(0.24) }]}>
              <View style={styles.supportHeader}>
                <View style={[styles.supportIcon, { backgroundColor: primaryColorAlpha(0.12) }]}>
                  <MaterialIcons name="support-agent" size={24} color={PRIMARY_COLOR} />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={[styles.supportTitle, { color: theme.text }]}>Signal Support Node</Text>
                  <Text style={[styles.supportSubtitle, { color: muted }]}>Submit an encrypted inquiry</Text>
                </View>
              </View>

              <View style={styles.formBlock}>
                <Text style={[styles.inputLabel, { color: muted }]}>Ticket Category</Text>
                <Pressable onPress={() => setIsCategoryOpen((prev) => !prev)} style={[styles.selectButton, { backgroundColor: surface, borderColor: border }]}>
                  <Text style={[styles.selectText, { color: theme.text }]}>{ticketCategory}</Text>
                  <MaterialIcons name={isCategoryOpen ? 'expand-less' : 'expand-more'} size={20} color={muted} />
                </Pressable>
                {isCategoryOpen ? (
                  <View style={[styles.selectMenu, { backgroundColor: surface, borderColor: border }]}>
                    {ticketCategories.map((category) => (
                      <Pressable
                        key={category}
                        onPress={() => {
                          setTicketCategory(category);
                          setIsCategoryOpen(false);
                        }}
                        style={styles.selectOption}
                      >
                        <Text style={[styles.selectOptionText, { color: ticketCategory === category ? PRIMARY_COLOR : secondary }]}>{category}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <View style={styles.formBlock}>
                <Text style={[styles.inputLabel, { color: muted }]}>Subject</Text>
                <TextInput
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                  placeholder="Summarize the request..."
                  placeholderTextColor={muted}
                  style={[styles.input, { backgroundColor: surface, borderColor: border, color: theme.text }]}
                />
              </View>

              <View style={styles.formBlock}>
                <Text style={[styles.inputLabel, { color: muted }]}>Message Space</Text>
                <TextInput
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                  placeholder="Detail your inquiry coordinates..."
                  placeholderTextColor={muted}
                  multiline
                  textAlignVertical="top"
                  style={[styles.textarea, { backgroundColor: surface, borderColor: border, color: theme.text }]}
                />
              </View>

              <Pressable
                onPress={handleSendTicket}
                disabled={!ticketSubject.trim() || !ticketMessage.trim()}
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    opacity: !ticketSubject.trim() || !ticketMessage.trim() ? 0.45 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.submitText}>Transmit Support Request</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {showToast ? (
          <View style={[styles.toast, { bottom: 24 + insets.bottom }]}>
            <MaterialIcons name="cloud-done" size={16} color={PRIMARY_COLOR} />
            <Text style={styles.toastText}>Protocol transmitted successfully! Ticket ID #KT-{ticketId}</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
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
    letterSpacing: 1.5,
    fontWeight: '800',
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
    gap: 28,
  },
  searchBlock: {
    gap: 10,
  },
  searchWrap: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontWeight: '700',
    paddingVertical: 0,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '900',
  },
  categoryRail: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 20,
  },
  categoryChip: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  articleCount: {
    color: PRIMARY_COLOR,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqButton: {
    minHeight: 64,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  faqAnswerWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  faqAnswer: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  emptyBody: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  supportCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  supportSubtitle: {
    marginTop: 2,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '800',
  },
  formBlock: {
    gap: 6,
  },
  inputLabel: {
    marginLeft: 4,
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  input: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontWeight: '700',
  },
  textarea: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  selectButton: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectText: {
    flex: 1,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '800',
  },
  selectMenu: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectOptionText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '800',
  },
  submitButton: {
    height: 48,
    borderRadius: 17,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  submitText: {
    color: '#ffffff',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '900',
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toastText: {
    flexShrink: 1,
    color: '#ffffff',
    ...fontSize.n5,
    lineHeight: fontSize.n5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default HelpCentre;
