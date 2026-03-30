import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fontScale } from '../fonts';

type VoteTab = 'Hot' | 'For You' | 'Favourites' | 'Recents';

type Track = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  image: string;
  selected?: boolean;
};

const tabs: VoteTab[] = ['Hot', 'For You', 'Favourites', 'Recents'];

const tracks: Track[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'Cyber Pulse',
    duration: '0:30',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCwcJyo6lWEKv7asZ4R83Y8odVElZU7RwGNOYMHVqJz5RR0th0hnTHT7fcx9KO1Dj6BIeD7xZKkUXk5SGX8dp_Z2lvppJ2o5HHgLw1xdhyTKtE5_QxR9Vh--IacMc8pqIx-yAS_qm-z7Uh33CvKS2y5xGgJfEvqPyhYfpF8RmSf3V5DoMS_CUnyIlftd9qgT-7aZl24qOL0S2UzI4HY3znALsV4XgSG50sTjgParBuZ9h2qlX1qtkCfuoXrs59Dw8qxs9qJUQSNfseq',
    selected: true,
  },
  {
    id: '2',
    title: 'Midnight Echoes',
    artist: 'The Glitch Collective',
    duration: '0:15',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcs7sQlaAnpuXU45Inkk86gsQ46WNSxnTSMpD0eS5lh-Lvjk9vM1T53ZJR-tJao5DYdKJP87rqK7SLR4eda6o0XjZIeP96ZzVGR2bnB_cqTpFF5HsVFssva31eZVTHBhyYB5h8eySrfql7KjFI9Y66RKpepR8tIEh_58VEEuHZvTdwVICYTCIWn4Qw1kBVkaPnAruM3n7sX0oO3wYyRcH7TsuC3tJjhTL1Ol8XqCVFaEqVM6WV_bCtvE6yJW7r_yCgbi8uN4OPziOq',
  },
  {
    id: '3',
    title: 'Bassline King',
    artist: 'Underground Vibe',
    duration: '0:45',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBepb023bIzqUXl-vj2pBqn68ofDcUBC1uK2yrwx72bKvSa0a9G2nx0EmnD0MZlKPw9sQjOx1dKX0q7uiuKA1-ge9s6XA6vGTg27TN0l9R2f9qhk4UUKGpgq1thmWV7gRVtJOU1FI3tMjpimjrMlipWRJDLlYv7mUohw9h8lY-2x7tkPsveq5bknhP_0NrBotnIJZbxdqWEfSDab1lQsk96Et92CN0ssNODPodbkMllrRNJ8yYyF1wkIl-NoY8JYL03w8TdZ1uY7Zs7',
  },
  {
    id: '4',
    title: 'Electric Sky',
    artist: 'Lunar Horizon',
    duration: '1:00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTQfqYY7PX35jwpz_04vamBg_x2QuQm55Tnge9QiwAQlN294zrIjLDymbIeR5DLkI3iEqMtNT45x6n0CMA9dS5SZI0ER6dNupNVhok_ObJzNZEpvMi-rrIWcLTJ-rRc-FieWgqw94E_6UVOErUHqdHo4eIRX4HyCG-a9Oo_ndJmiZ1Ia2Tgs0jumAXxaAhzm1RSvZf1U1VvHIZFKyPDo5P5TGk35Wtl4WWHxXD2IAhd6smG-_IETeSpVVHmzXXWkV4en7vYeApytwJ',
  },
  {
    id: '5',
    title: 'Vortex Flow',
    artist: 'Aura Beats',
    duration: '0:24',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCq5tZb052dujwS85ZD50WDi3Y1Jj6ssDc0uGUHwyNKlm0BdPDDZb9bDQ5V3vrfK-LKxeJfYm41i3zzMEW_Sl5n7CxjA6nTPm9ovytkQIZx-kegbO7j7DKDWYQ8MY-2vR3bz72jpZ65F4_p3HgJ1LVpyQcs2GNO2jkcZj3ZkFka-0M7y6xEZjLlK8mdOSkSEcjbv9G0GcXuf96NVQhx4-ju-jb__73-YDI_Ayc6My0Za3BZgi-kvtVfSlMBKuNsaox0HHRF5ZflQIuT',
  },
];

type VoteSheetContentProps = {
  onClose?: () => void;
  sheetMode?: boolean;
};

export const VoteSheetContent: React.FC<VoteSheetContentProps> = ({ onClose, sheetMode = false }) => {
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<VoteTab>('Hot');
  const [query, setQuery] = useState('');

  const filteredTracks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tracks;
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(normalized) ||
        track.artist.toLowerCase().includes(normalized),
    );
  }, [query]);

  const screenBackground = isDark ? '#0a050d' : theme.background;
  const panelBackground = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const headerBackground = isDark ? 'rgba(10,5,13,0.82)' : 'rgba(255,255,255,0.9)';
  const rowBackground = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const rowHover = isDark ? 'rgba(255,255,255,0.1)' : theme.card;
  const ringColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtleText = isDark ? '#94a3b8' : theme.textSecondary;
  const mutedText = isDark ? '#64748b' : theme.textMuted;

  return (
    <View style={[styles.sheetRoot, sheetMode && styles.sheetRootOverlay]}>
      {!sheetMode ? <View style={styles.backdrop} /> : null}
      <View style={[styles.modalCard, sheetMode && styles.sheetCard, { backgroundColor: panelBackground, borderColor: ringColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackground, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border }]}>
          <Pressable style={styles.headerButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Sound Select</Text>
          <Pressable style={styles.headerButton}>
            <MaterialIcons name="search" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.searchWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: ringColor }]}>
            <MaterialIcons name="search" size={20} color={subtleText} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for sounds"
              placeholderTextColor={subtleText}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, { borderBottomColor: isActive ? '#930df2' : 'transparent' }]}
                >
                  <Text style={[styles.tabText, { color: isActive ? '#930df2' : subtleText }]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="bolt" size={20} color="#d915d2" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Trending Audio</Text>
            </View>
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>Hot Now</Text>
            </View>
          </View>

          <View style={styles.list}>
            {filteredTracks.map((track) => (
              <View
                key={track.id}
                style={[
                  styles.trackRow,
                  {
                    backgroundColor: rowBackground,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : theme.border,
                  },
                ]}
              >
                <View style={styles.trackMain}>
                  <View style={[styles.coverWrap, { borderColor: ringColor }]}>
                    <Image source={{ uri: track.image }} style={styles.coverImage} />
                    <View style={styles.coverOverlay}>
                      <MaterialIcons name="play-arrow" size={30} color="#fff" />
                    </View>
                  </View>

                  <View style={styles.trackCopy}>
                    <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={[styles.trackArtist, { color: subtleText }]} numberOfLines={1}>
                      {track.artist}
                    </Text>
                    <Text style={[styles.trackDuration, { color: mutedText }]}>{track.duration}</Text>
                  </View>
                </View>

                <View style={styles.trackActions}>
                  <View style={styles.utilityActions}>
                    <Pressable style={styles.utilityButton}>
                      <MaterialIcons name="bookmark-border" size={22} color="#930df2" />
                    </Pressable>
                    <Pressable style={styles.utilityButton}>
                      <MaterialIcons name="content-cut" size={22} color="#930df2" />
                    </Pressable>
                  </View>

                  <Pressable
                    style={[
                      styles.selectButton,
                      track.selected
                        ? styles.selectButtonActive
                        : { backgroundColor: rowHover },
                    ]}
                  >
                    <MaterialIcons
                      name={track.selected ? 'check' : 'add'}
                      size={22}
                      color="#fff"
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const Vote: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <VoteSheetContent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  sheetRoot: {
    flex: 1,
  },
  sheetRootOverlay: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.8)',
  },
  modalCard: {
    flex: 1,
    marginTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetCard: {
    flex: 0,
    maxHeight: '84%',
    marginTop: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 36,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(10),
  },
  tabsScroll: {
    marginBottom: 24,
  },
  tabsContent: {
    gap: 14,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    paddingBottom: 7,
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(12),
  },
  hotBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(217,21,210,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217,21,210,0.2)',
  },
  hotBadgeText: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  list: {
    gap: 14,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
  },
  trackMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  coverWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  trackCopy: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  trackArtist: {
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
  },
  trackDuration: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(9),
    marginTop: 2,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  utilityButton: {
    width: 28,
    height: 28,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonActive: {
    backgroundColor: '#d915d2',
    shadowColor: '#d915d2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
});

export default Vote;
