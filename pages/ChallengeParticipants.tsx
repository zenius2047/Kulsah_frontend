import React, { useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fontScale } from '../fonts';

type FilterKey = 'Trending' | 'Recent' | 'Most Voted' | 'Featured';

type Participant = {
  id: string;
  handle: string;
  votes?: string;
  image: string;
  featured?: boolean;
};

const filters: FilterKey[] = ['Trending', 'Recent', 'Most Voted', 'Featured'];

const participants: Participant[] = [
  {
    id: '1',
    handle: '@dance_king',
    votes: '12.4k',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPx8F8tf_yhrVPixB60DpKEp4iTle4JtPaZ8AjH8kYmQJ0n3DUPeSAffqmgQqGzZxAwccfiFEDivKpcmuRzDKfF29rggR2qFVZp3FckG4rMzgCsOEZFMAwWpo2dZnG4qnYyf-IvlVFbatYK278MEkBEoOD5OflOOOqj5iVH_2qvQgmB5Ob4U3iaUBtBupbl8NgsLdZlU6LasD4erAQmufyhTMHDXsEjmgj8n6Sa2YSwOPEnrRsTIcQcr-hBZQbF36cz0a7g_yiiEX7',
    featured: true,
  },
  {
    id: '2',
    handle: '@melody_vibe',
    votes: '8.2k',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAY4dTlxTy0sRlW2V4vFmMJJbgepN7bFgL_FOjz4ICcOtX-WGyOPl9Q_xcapXXel4WSA3ac6uqUXITcxjfLsibo5WiT5zYRbNBMEFp06bKDJzYOMdWHhn7cANdN_ujb9VNFy7IH40MkfoWXokrNjyt7MXuWbHRb7rl4qcXhboQJh4u9tHjxu-7ZIUAuk3ATJ1BI-FsRY4sA-_Atf3yNol1Es2xEhY-pg0Rz1v2xVvkExtHFdOwACJW3WouzWKasluAjPIz_aF87ABw0',
  },
  {
    id: '3',
    handle: '@step_up',
    votes: '5.1k',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB-Trc4kwXvyw4mE57iGKeIB_oCVIXvoXeDndNeWuJ0SlDaQLQU0Bb9LXRbXg2t_8502FyTvw8Y0k2PPGVVXQIuTH5KcYG1NiIK4vqJDRDo95cOK2AFkvmSTncp2JrRNYpyWJS4RWrz8sxy2hKTTlfIDFUbITIdGWYUzPQf4GWCHFStWLllu2jZTwwE5Hbk95y_2pbVdG0YQfulcgUsggFfS6qC4Rfkt60PSXTi0WcWX1AW5gj6c2-2G2P1fGK75CPaqdd4-hQVW2l2',
  },
  {
    id: '4',
    handle: '@karaoke_gal',
    votes: '4.9k',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5_7J82AS8RgNRblEiusHx2aOVJ9DPudICXxvKHEqS_G8huW7WwAYTkEkgxJSF_yPb6rmbVJCB3SErkolrQU8uGKD-NCvWOENdKVaPd_FCDJkVxDikqdZ55YM8mSxF_G4vI3aWiOet40PM2HryEAEFWXswXobaq1l9IuMWNbTEmUHOp-0a-ImZXqfS0zXMPkAoTQQh5jTv8CWNjJJ5EkruKMAp3F1WtoaAx4aIJ5AcsairfJkSlO8AecQ-AsCpARudwUJLbcUREXls',
  },
  {
    id: '5',
    handle: '@vocal_pro',
    votes: '3.2k',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApdI0WM-aqJDlLMjOuN9POPVENL_h5UhNR0EjuxTgUYmfy6GDZLErI1HKaQOzAqj6cAIcqnJbNjRVTIw7MdDEFhqOKiOSUHcKi_wNc287-_WEd-17Gg-w-aaoGeasTf_dcsYOSzc3AIMHXr75ac_upYoJ77yDgh143a4Hu79FpwhzE3XUh3r8XtxMtcVngvleME27giCJDRgA-t8Vg1jRc_E4swhdqJ76DtV7AY9r536_SCA-e5lwTGIpE1wavsZW4R5ocgfVKf-1_',
  },
  {
    id: '6',
    handle: '@rhythm_master',
    votes: '2.8k',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEACI0nufXZvfiLnpJzBsFcp5A5Um4j5oKQu8uVXN0YqHShVkVh1OCBNUOb7gp-gattU7SJ3aq1LJQIC9zj6T5ZZqBbPef2QDUeQBzp-Xlo6eG1H1kzeAKBd_YobVHkPt_0mruSd_spOMcfydmvUvUZ-7tMkxiv4FegrUg0mqhX4jxw_ZwBoqzQsOKLUkaWtDkuINz8yM9RO_cZICN6arO1v-bDKG2HsWdRhI5l6dSCu1EvspqgSoB60UfOlB4ooHj6NppgPFuYHlu',
  },
  {
    id: '7',
    handle: '@user_09',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAxs7qx8FO-Foq-PWWQyoAQfT9Rh4Vd5V0TVjRIgP_4vt-dPT6ySRzeBJYK4ipGUupbrs2cz5T2LGX14ZkiAcDvanFDWiP-sKZmhYj3JlkI3rZz44i2wGoM4FYO6RgtRYYUP6HRwMqcnpbgkyx5GZK799Fn4JA1A5WxXFDReYjj7WNMLRxApFqmXqh2rBxJectks1iaVUnE7tENhKnBBdnlMMbhWOnYKVB6K7RWXxKAe8e9e1ZpiqGIkjooUJuDeTHxlBb1wiDmhOQ-',
  },
  {
    id: '8',
    handle: '@talent_scout',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAfoMbz2g5HuQX6kh0_xL4HwK2Kp_V_CVJZuGxUZKJaLA20XyDXUItYugqyAyY_YbOcjOjC9vwtHpB4G5nN1cJqm7VZjN7lqOuWmDyR6hrZljZUcx1sqT0wLbna659YIChP8e7vW4xLghLNGXedo6lqPFL4Ykb91k-zSQXIzTw3whEYsfAbqwMmd5AMXvWG6z0qzlwncJGlYYnEuDq2jM04bsn043_2LkC2uJm5vD7dQXZXLFReODHxGGhKOUmnimaosypOeN14hU3s',
  },
  {
    id: '9',
    handle: '@viral_star',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAY3PT0tCawTn6lBxd3T0YVlUQBW7okr_45vT7otRnC4wG3PRE_ap6UM7O0aAuGkqQGCxGnr8wD_8JAnby1h0vOfG3RUDjkAp6fgMJZnrSGXJ0IW81x_8nOBJ-5f854pH1v5CO0cydWmy-MgRN2GtdjqKGH-YbOKkAZ0-DtDqpqt94Gim-ozyzo79uClJ19mUxWg_gKPrD5gAyrNb1B44aTsNOaWTB-0DDjWKsfHzhk5QTifmgfsggmPkXnlGw0_OC4SsnNkGZ_WjnK',
  },
  {
    id: '10',
    handle: '@beat_drop',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAC_ghb3VV23ihEL2SNKdfo0mwq5F55XVqgra1hQC1fzz7Ii_VTDUE3fviE13GkaNG74pT1m5Y68kucHMBRwYNRv4DZiNlNN7pCGz_Hn-07nRdwer1z8x2mbLS43gs4YKUxFooGd43QQcDr1QenR1FyX5BfRc-wopj3N8TN0gTAxWqYQgeDJHZ9OsJzcpCrC8naQI5o0crDy3z34y2jUKfkRtWu1lRofL_F3wwB2rjtNqHf-zfjdsmtrZY_7RHquQDa4JFRFRRIRveS',
  },
  {
    id: '11',
    handle: '@soul_singer',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSzVYJnjjwX0yZzXL2HK9rtXnCbewhlzRmCRXvryyXNF1vPMPrGfydvRV4TD8gFOv7rU2fraeFxXztSrRYAm1Wc0cuxBxuZgnTP2GtKub_sthOkQuUKcMM5Cqkx9ND4W5l_xbPeqDhS7FIPkp9LHu7Uc7XxV8ThjB_ShX6FkzP3FHBDpWepVVwn326lGRxNHXk7OpP_B4e4MO1sA6ghdC0vVCx-PFRRqZzr8MoMPcvRmDPjnFyF9URj3PO0XHFS40CQ5GjilD_Dhfx',
  },
  {
    id: '12',
    handle: '@dance_mania',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIJzoeKOpcAxsil3ZzmwE3J0h7HaNuOfKwyIkgLq-zdnSLFCwYayfym5pRQIPnd7zUsNp5b3HXl0ld4fOgCZ4xOkpSPxgQpuaUD64N1tDpDPn9EYGld83HnqlY5eGasPo-Kl8DHDtf3BGmDahExi8DXHJRd8UbCtQLGyNgjAquwzCIVghXW6A63Bri-ga0IAVMwJCCAWcHW-OVXDaHVbx2uQcHPGlFukSjDO8Qq6lcP-ExXTTk5TfSFOlPLzKdCKPLyVqD-xRuB1ED',
  },
];

const ChallengeParticipants: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('Trending');

  const numColumns = width >= 900 ? 5 : width >= 600 ? 4 : 3;
  const cardGap = 10;
  const horizontalPadding = 12;
  const totalGapWidth = cardGap * (numColumns - 1);
  const itemWidth = Math.floor((width - horizontalPadding * 2 - totalGapWidth) / numColumns);
  const itemHeight = Math.floor(itemWidth * 1.34);

  const filteredParticipants = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    let next = participants;

    if (activeFilter === 'Featured') {
      next = next.filter((item) => item.featured);
    }

    if (normalized) {
      next = next.filter((item) => item.handle.toLowerCase().includes(normalized));
    }

    return next;
  }, [activeFilter, query]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <LinearGradient
          colors={['#0f0712', '#0a0a0a', '#060507']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityLabel="Back"
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="chevron-left" size={20} color="#ffffff" />
            </Pressable>
            <Text style={styles.headerTitle}>Challenge Participants</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for participants..."
              placeholderTextColor="#6b7280"
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((filter) => {
              const active = filter === activeFilter;
              return (
                <Pressable
                  key={filter}
                  style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipIdle]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextIdle]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.grid, { gap: cardGap }]}>
            {filteredParticipants.map((participant) => (
              <Pressable
                onPress={()=>(
                  navigation.navigate("ChallengeFeed")
                )}
                key={participant.id}
                style={[styles.card, { width: itemWidth, height: itemHeight }]}
              >
                <Image source={{ uri: participant.image }} style={styles.cardImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.84)']}
                  locations={[0.4, 1]}
                  style={styles.cardOverlay}
                />

                {participant.votes ? (
                  <View
                    style={[
                      styles.voteBadge,
                      participant.featured ? styles.voteBadgeFeatured : styles.voteBadgeDefault,
                    ]}
                  >
                    <Text style={styles.voteText}>{participant.votes}</Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text numberOfLines={1} style={styles.handle}>
                    {participant.handle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {filteredParticipants.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="person-search" size={34} color="#d915d2" />
              <Text style={styles.emptyTitle}>No participants found</Text>
              <Text style={styles.emptyText}>Try another search or switch filters.</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(10,10,10,0.94)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(15),
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  searchInput: {
    height: 52,
    paddingLeft: 42,
    paddingRight: 14,
    borderRadius: 18,
    color: '#ffffff',
    backgroundColor: '#121212',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(12),
  },
  filterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: '#d915d2',
  },
  filterChipIdle: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterText: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterTextIdle: {
    color: '#9ca3af',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  voteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voteBadgeFeatured: {
    backgroundColor: '#d915d2',
  },
  voteBadgeDefault: {
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  voteText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
  },
  cardFooter: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
  },
  handle: {
    color: '#ffffff',
    opacity: 0.92,
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(10),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(16),
  },
  emptyText: {
    color: '#94a3b8',
    fontFamily: 'PlusJakartaSans',
    fontSize: fontScale(13),
  },
});

export default ChallengeParticipants;

