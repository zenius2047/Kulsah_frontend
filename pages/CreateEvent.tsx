import React, { useState } from 'react';
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
import { mediumScreen } from '../types';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

const toolItems = [
  { label: 'Editor', icon: 'photo-camera' as const },
  { label: 'AutoCut', icon: 'videocam' as const },
  { label: 'Captions', icon: 'closed-caption' as const },
  { label: 'AI Self', icon: 'face-retouching-natural' as const },
  { label: 'Cutout', icon: 'content-cut' as const },
];

const actionCards = [
  {
    title: 'Create Event',
    description: 'Schedule a live session or digital workshop with your fans.',
    icon: 'calendar-today' as const,
    tint: '#930df2',
    bg: 'rgba(147, 13, 242, 0.16)',
  },
  {
    title: 'Challenge',
    description: 'Viral prompts for your community.',
    icon: 'emoji-events' as const,
    tint: '#d915d2',
    bg: 'rgba(217, 21, 210, 0.16)',
  },
  {
    title: 'Edit',
    description: 'Jump into the studio.',
    icon: 'movie-edit' as const,
    tint: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.16)',
  },
];

const templateTabs = ['For You', 'Viral Song', 'Trendy', 'AI', 'Aesthetic'];

const templateCards = [
  {
    id: 'template-1',
    title: 'TRANSITION',
    meta: '518 videos / 16 clips',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVk2i5XurccDZrH1xCHHLOAGZ4-eqTQM1H681SL8r11dxfuvFGXKiHwpcjascOVs7MdodzE5QE3NvnU0t0w02hVSoxItSgOHYBEGDcFrTPF6CN_NV0d8hHRAQek6YswBm1i8Y6pbjbCIqqFQDZVi2fYi1SmmyLg00Jg5h01mg1bCyYB_24AX5aLsgO7F2xVJoTNlzUrmVC3R35Bs-CP2jgW6JvUSgrcQgTEOs8qRaqOuWAF6HBluIzJ3CdqllhsHQRAqHAiovB05_L',
  },
  {
    id: 'template-2',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCaWfaCS3hFMgX78KM3UzfLmDhrt6YKQ1yztJ9wQvkrZNTFzzqUOSM0J0zhrCx2oOshDMi7kwiVPOMmwtRCKQCokxQKxU4MT8hYJyuE59MBNxGtIlOQwfakQUoXj5SfJZYdFKoyx7atbvq87k0M6SxW0lth-6hpFIyp-9_wODhvjdDsEilTyEY4JQ2nxb7NWtmyuqCPfxhlNyBwGw0qcA73ITf1KEZ1JOfW6ubMr8XZLTmgUNWmX1YU8upEqkhgsmYgIgtFgWHJ7MkE',
  },
  {
    id: 'template-3',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEfbCbnVgVoncqFcjGveGfDIWO8dKSZYdjgo1UCjvDWpXaArhYL8kZNQtAVHZeEx3_YfUx7fSk8pw-nkgTzWvRaGMgE-aWYqfa2iEKi7DmCbbzmrPdGEEI_qe2qm0PnrN6ch5-eUqVIknPZWqNkIgL2MgyY1l84zXlMhbG8WteYGG66u164QGAPNTHW9XxnkZ10ShmfToufMJQX9w9fn8Qxgctp_CxGtQrWF_1i8miDXTgjBPDScaYx6vn99gtP4hqZEpi599HdRk0',
  },
];

const trendingSounds = [
  {
    id: 'sound-1',
    title: 'Neon Pulse (Original Mix)',
    meta: '2.4M videos',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDsB11UW13TiE9XiwJOYLYz8Ygs3pOizicEoRk9aVl__8TriOkISwh3SN1ODtcfqvG7P9jMbMNhfVkqRUCZsKPiI-mosfwke53c_VeMaX9r0povLkVkar1zbpD19Yf9jgUbQczEzzQxl61m1exXQmYV3kxRA9N0syS0Q6CnZ66un3dAnI_I9zU81fG1m3VSn5AraGnU-47S0dZXQB4AJl4bL_Ebv9UpMC22obF1CQAlQNK70W8uAkS8npFBEyUnZ6K2aQhFnwpmPhDe',
  },
];

const draftImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAsCUcDaYSc41ck8ki_tSLGBl-XytkxzbcSuL10MGZHKHl6kgv5rgos8zJgPbLlRWqNFen-NeOXIKDisgt0skCFxY3EnkUQ6TdEMuiFTcngJfgefGjUduNvz-hIc12JVVgtGywwxvT_3WBYqoebi4ubiD8-caFUT7xzAcXS2Y1cVKyLt6-S_nTz2Q1x8TUZ4Ehu4up39tO3RE6cxEp6xhV0OxT4-x7MuSnEprxLB9H-gz1S0B4L-dOImHhsy-F9X9WobNI3ETT_0Kd0';

const CreateEvent: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const [activeTemplateTab, setActiveTemplateTab] = useState('For You');
  const visibleTemplates = templateCards;
  const navigation = useNavigation<any>();
  const bgGradient = isDark
    ? ['#120816', '#0a050d', '#050207']
    : ['#f8fafc', '#eef2ff', '#f8fafc'];
  const shellBg = isDark ? 'rgba(10,5,13,0.82)' : 'rgba(255,255,255,0.92)';
  const shellBorder = isDark ? 'rgba(255,255,255,0.05)' : theme.border;
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : theme.card;
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const muted = isDark ? '#64748b' : theme.textMuted;
  const titleTone = isDark ? '#ffffff' : theme.text;
  const darkOverlay = isDark ? 'rgba(0,0,0,0.42)' : 'rgba(15,23,42,0.35)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={bgGradient}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* <View style={styles.topGlowOne} pointerEvents="none" />
        <View style={styles.topGlowTwo} pointerEvents="none" /> */}

        <View style={[styles.header, { backgroundColor: shellBg, borderBottomColor: shellBorder }]}>
          <Pressable
          onPress={()=> navigation.goBack()}
          style={styles.headerIconButton}>
            <MaterialIcons name="close" size={24} color={titleTone} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: titleTone }]}>CREATE</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolsRow}
          >
            {toolItems.map((item) => (
              <Pressable key={item.label} style={styles.toolItem}>
                <View style={[styles.toolIconWrap, { backgroundColor: softSurface }]}>
                  <MaterialIcons name={item.icon} size={28} color={titleTone} />
                </View>
                <Text style={[styles.toolLabel, { color: subtle }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.heroRow}>
            <Pressable style={styles.newVideoCard}>
              <View style={styles.addBadge}>
                <MaterialIcons name="add" size={22} color="#ffffff" />
              </View>
              <Text style={styles.newVideoTitle}>New video</Text>
              <LinearGradient
                colors={['rgba(147,13,242,0.08)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </Pressable>

            <Pressable style={styles.draftCard}>
              <Image source={{ uri: draftImage }} style={styles.draftImage} />
              <View style={[styles.draftOverlay, { backgroundColor: darkOverlay }]}>
                <Text style={styles.draftCount}>1</Text>
                <Text style={styles.draftLabel}>DRAFTS</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.actionsColumn}>
            {actionCards.map((card) => (
              <Pressable key={card.title} style={[styles.actionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.actionIconWrap, { backgroundColor: card.bg }]}>
                  <MaterialIcons name={card.icon} size={28} color={card.tint} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={[styles.actionTitle, { color: titleTone }]}>{card.title}</Text>
                  <Text style={[styles.actionDescription, { color: subtle }]}>{card.description}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={muted} />
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.templatesTitle, { color: titleTone }]}>Templates</Text>
              <Pressable style={[styles.searchButton, { backgroundColor: softSurface }]}>
                <MaterialIcons name="search" size={20} color={titleTone} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.tabRow, { borderBottomColor: shellBorder }]}
            >
              {templateTabs.map((tab) => {
                const isActive = tab === activeTemplateTab;

                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTemplateTab(tab)}
                    style={styles.tabButton}
                  >
                    <Text style={[styles.tabText, { color: muted }, isActive && { color: titleTone }]}>
                      {tab}
                    </Text>
                    <View
                      style={[
                        styles.tabIndicator,
                        isActive && styles.tabIndicatorActive,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.templateGrid}>
              <Pressable style={styles.templateTallCard}>
                <Image
                  source={{ uri: visibleTemplates[0].image }}
                  style={styles.templateTallImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.82)']}
                  style={styles.templateOverlay}
                />
                <View style={styles.templateCaption}>
                  <Text style={[styles.templateName, { color: '#ffffff' }]}>{visibleTemplates[0].title}</Text>
                  <Text style={[styles.templateMeta, { color: subtle }]}>{visibleTemplates[0].meta}</Text>
                </View>
              </Pressable>

              <View style={styles.templateStack}>
                {visibleTemplates.slice(1).map((item) => (
                  <Pressable key={item.id} style={styles.templateSmallCard}>
                    <Image source={{ uri: item.image }} style={styles.templateSmallImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.templateOverlay}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.soundSectionTitle, { color: titleTone }]}>Trending Sounds</Text>
              <Pressable>
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            </View>

            <View style={styles.soundList}>
              {trendingSounds.map((sound) => (
                <Pressable key={sound.id} style={styles.soundRow}>
                  <Image source={{ uri: sound.image }} style={styles.soundThumb} />
                  <View style={styles.soundTextWrap}>
                    <Text style={[styles.soundTitle, { color: titleTone }]}>{sound.title}</Text>
                    <Text style={[styles.soundMeta, { color: muted }]}>{sound.meta}</Text>
                  </View>
                  <View style={[styles.soundAddButton, { backgroundColor: softSurface }]}>
                    <MaterialIcons name="add" size={18} color={titleTone} />
                  </View>
                </Pressable>
              ))}
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
  topGlowOne: {
    position: 'absolute',
    top: -100,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(147, 13, 242, 0.18)',
  },
  topGlowTwo: {
    position: 'absolute',
    top: 200,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 21, 210, 0.1)',
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 16: 13,
    letterSpacing: 3.2,
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  toolsRow: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    gap: 22,
  },
  toolItem: {
    width: 72,
    alignItems: 'center',
    gap: 10,
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 12: 8,
    lineHeight: 13,
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    height: 160,
    marginTop: 12,
  },
  newVideoCard: {
    flex: 2,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  newVideoTitle: {
    color: '#000000',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 16: 13,
  },
  draftCard: {
    flex: 1,
    borderRadius: mediumScreen ? 24: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  draftImage: {
    width: '100%',
    height: '100%',
  },
  draftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  draftCount: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(28),
  },
  draftLabel: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 14: 10,
    letterSpacing: 1.2,
  },
  actionsColumn: {
    marginTop: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 16: 13,
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16: 12,
    lineHeight: 20,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  templatesTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 21: 18,
    letterSpacing: -0.6,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    gap: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 18:14,
    marginBottom: 12,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabIndicator: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: '#ffffff',
  },
  templateGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  templateTallCard: {
    flex: 1,
    aspectRatio: 0.62,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  templateTallImage: {
    width: '100%',
    height: '100%',
  },
  templateStack: {
    flex: 1,
    gap: 12,
  },
  templateSmallCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  templateSmallImage: {
    width: '100%',
    height: '100%',
  },
  templateOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  templateCaption: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  templateName: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 15:11,
    letterSpacing: 0.6,
  },
  templateMeta: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 14:10,
    marginTop: 3,
  },
  soundSectionTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? 20:16,
  },
  seeAllText: {
    color: '#930df2',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 16:12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  soundList: {
    gap: 12,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  soundThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  soundTextWrap: {
    flex: 1,
  },
  soundTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? 16:13,
    marginBottom: 4,
  },
  soundMeta: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? 16:12,
  },
  soundAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateEvent;
