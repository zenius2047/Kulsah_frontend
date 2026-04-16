import React, { useEffect, useState } from 'react';
import { useThemeMode } from './theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediumScreen, setUser, user } from './types';

interface FanProfileProps {
  onLogout?: () => void;
  onToggleRole?: () => void;
}

type ProfileTab = 'Video' | 'Premium' | 'Tickets' | 'Saved' | 'Favorite';

type StreakData = {
  count: number;
};

type Creator = {
  id: string;
  name: string;
  img: string;
  handle: string;
  premiumCount: number;
};

type PremiumAsset = {
  id: string;
  title: string;
  views?: string;
  count?: number;
  img: string;
};

const FanProfile: React.FC<FanProfileProps> = ({ onToggleRole }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('Video');
  const [streak, setStreak] = useState<StreakData>({ count: 7 });
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  useEffect(() => {
    setStreak({ count: 7 });
  }, []);

  useEffect(() => {
    setSelectedCreator(null);
  }, [activeTab]);

  const tabs: { id: ProfileTab; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'Video', icon: 'movie' },
    { id: 'Premium', icon: 'workspace-premium' },
    { id: 'Tickets', icon: 'local-activity' },
    { id: 'Saved', icon: 'bookmark' },
    { id: 'Favorite', icon: 'favorite' },
  ];

  const stats = [
    { label: 'Supporting', value: '24', onPress: () => navigation.navigate('Feed') },
    { label: 'Unlocked', value: '12', onPress: () => navigation.navigate('Feed') },
    {
      label: 'Attending',
      value: '2',
      onPress: () => navigation.navigate('FanSettings', { view: 'identity', fromProfile: true }),
    },
  ];

  const vibes = ['Afrobeats', 'Synthwave', 'Midnight R&B'];

  const favorites = [
    { name: 'Elena Rose', img: 'https://picsum.photos/seed/elena/150', handle: '@elena_r' },
    { name: 'Zion King', img: 'https://picsum.photos/seed/zion/150', handle: '@zion_k' },
    { name: 'Amara', img: 'https://picsum.photos/seed/amara/150', handle: '@amara_v' },
  ];

  const favoriteVideos = [
    { id: 'fv1', title: 'Midnight Soul Session', artist: 'Elena Rose', views: '1.2M', img: 'https://picsum.photos/seed/vid1/400/225' },
    { id: 'fv2', title: 'Summer Tour BTS', artist: 'Burna Boy', views: '840K', img: 'https://picsum.photos/seed/vid2/400/225' },
  ];

  const subscribedCreators: Creator[] = [
    { id: 'c1', name: 'Elena Rose', img: 'https://picsum.photos/seed/elena/150', handle: '@elena_r', premiumCount: 12 },
    { id: 'c2', name: 'Zion King', img: 'https://picsum.photos/seed/zion/150', handle: '@zion_k', premiumCount: 8 },
    { id: 'c3', name: 'Amara', img: 'https://picsum.photos/seed/amara/150', handle: '@amara_v', premiumCount: 15 },
  ];

  const premiumContent: Record<string, { videos: PremiumAsset[]; playlists: PremiumAsset[] }> = {
    c1: {
      videos: [
        { id: 'pv1', title: 'Acoustic Session: Midnight', views: '12k', img: 'https://picsum.photos/seed/pv1/400/225' },
        { id: 'pv2', title: 'Behind the Scenes: Tour', views: '8k', img: 'https://picsum.photos/seed/pv2/400/225' },
      ],
      playlists: [{ id: 'pl1', title: 'Ethereal Soul Collection', count: 12, img: 'https://picsum.photos/seed/pl1/400/400' }],
    },
    c2: {
      videos: [{ id: 'pv3', title: 'Studio Vlog #42', views: '5k', img: 'https://picsum.photos/seed/pv3/400/225' }],
      playlists: [{ id: 'pl2', title: 'Afro-Cinema BTS', count: 5, img: 'https://picsum.photos/seed/pl2/400/400' }],
    },
    c3: {
      videos: [{ id: 'pv4', title: 'Vocal Masterclass', views: '20k', img: 'https://picsum.photos/seed/pv4/400/225' }],
      playlists: [{ id: 'pl3', title: 'Live Performance Archive', count: 24, img: 'https://picsum.photos/seed/pl3/400/400' }],
    },
  };

  const handleSwitchRole = async () => {
    const nextUser = {
      id: user?.id || 'mila_ray_01',
      name: user?.name || 'Mila Ray',
      role: 'creator' as const,
    };
    setUser(nextUser);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(nextUser));
    if (onToggleRole) {
      onToggleRole();
      return;
    }
    navigation.reset({
      index: 1,
      routes: [{ name: 'MainTabs' }, { name: 'Settings' }],
    });
  };

  return (
    <View style={[s.screen, { backgroundColor: theme.screen }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.coverSection}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
            }}
            style={s.cover}
          >
            <LinearGradient colors={[isDark ?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.08)', isDark ?'rgba(0,0,0,0.15)': 'rgba(255,255,255,0.15)', isDark?'rgb(6, 9, 19)': 'rgb(255, 255, 255)']} style={StyleSheet.absoluteFillObject} />

            <View style={s.headerRow}>
              <Pressable onPress={() => navigation.navigate('Feed')} style={[s.glassButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)' }]}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </Pressable>

              <View style={s.headerActions}>
                <Pressable onPress={() => navigation.navigate('FanSettings', { view: 'identity', fromProfile: true })} style={[s.glassButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)' }]}>
                  <MaterialIcons name="badge" size={20} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('FanSettings')} style={[s.glassButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)' }]}>
                  <MaterialIcons name="settings" size={20} color={theme.text} />
                </Pressable>
              </View>
            </View>
          </ImageBackground>

          <View style={s.profileRow}>
            <View style={s.avatarWrap}>
              <Image source={{ uri: 'https://picsum.photos/seed/profile/300' }} style={[s.avatar, {borderColor: isDark ?'#060913': 'white',}]} />
              {streak.count > 0 && (
                <Pressable onPress={() => navigation.navigate('Feed')} style={[s.streakBadge, {borderColor: isDark ?'#060913': 'white',}]}>
                  <MaterialIcons name="local-fire-department" size={12} color="#fff" />
                  <Text style={s.streakCount}>{streak.count}</Text>
                </Pressable>
              )}
            </View>

            <View style={s.nameWrap}>
              <Text style={[s.name, { color: theme.text }]}>Alex Rivera</Text>
              <Text style={[s.member, { color: theme.textSecondary }]}>Member #0042</Text>
            </View>
          </View>
        </View>

        <View style={[s.main, { backgroundColor: theme.screen }]}>
          <View style={s.vibesRow}>
            {vibes.map((vibe) => (
              <View key={vibe} style={[s.vibeChip, { backgroundColor: isDark ? '#111827' : theme.surface, borderColor: theme.border }]}>
                <Text style={[s.vibeText, { color: theme.text }]}>{vibe}</Text>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('FanSettings')} style={s.vibeEdit}>
              <MaterialIcons name="edit" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={s.statsRow}>
            {stats.map((stat) => (
              <Pressable key={stat.label} onPress={stat.onPress} style={[s.statCard, { backgroundColor: isDark ? '#111827' : theme.card, borderColor: theme.border }]}>
                <Text style={[s.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.actionSection}>
            <Pressable onPress={handleSwitchRole} style={s.switchRoleCard}>
              <LinearGradient
                colors={['#4f46e5', '#cd2bee']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.switchRoleGradient}
              >
                <View style={s.switchRoleLeft}>
                  <View style={s.switchRoleIcon}>
                    <MaterialIcons name="rocket-launch" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={s.switchRoleTitle}>Switch to Creator</Text>
                    <Text style={s.switchRoleMeta}>Upload, Go Live and Monetize</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>

          <View style={s.tabsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
              {tabs.map((tab) => (
                <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={s.tabButton}>
                  <MaterialIcons name={tab.icon} size={24} color={activeTab === tab.id ? '#cd2bee' : theme.textSecondary} />
                  <Text style={[s.tabText, { color: activeTab === tab.id ? '#cd2bee' : theme.textSecondary }, activeTab === tab.id && s.tabTextActive]}>{tab.id}</Text>
                  {activeTab === tab.id ? <View style={s.tabIndicator} /> : null}
                </Pressable>
              ))}
            </ScrollView>

            <View style={s.tabContent}>
              {activeTab === 'Favorite' && (
                <View style={s.sectionGroup}>
                  <View style={s.sectionBlock}>
                    <Text style={[s.sectionEyebrow, { color: theme.textSecondary }]}>Favorite Artists</Text>
                    <View style={s.listWrap}>
                      {favorites.map((artist) => (
                        <Pressable key={artist.handle} onPress={() => navigation.navigate('ArtistProfile')} style={[s.listCard, { backgroundColor: isDark ? '#111827' : theme.card, borderColor: theme.border }]}>
                          <View style={s.listLeft}>
                            <Image source={{ uri: artist.img }} style={s.listAvatar} />
                            <View>
                              <Text style={[s.listTitle, { color: theme.text }]}>{artist.name}</Text>
                              <Text style={[s.listMeta, { color: theme.textSecondary }]}>{artist.handle}</Text>
                            </View>
                          </View>
                          <View style={s.listRight}>
                            <MaterialIcons name="stars" size={18} color="#cd2bee" />
                            <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={s.sectionBlock}>
                    <Text style={[s.sectionEyebrow, { color: theme.textSecondary }]}>Favorite Videos</Text>
                    <View style={s.twoColGrid}>
                      {favoriteVideos.map((vid) => (
                        <Pressable key={vid.id} style={s.gridCard} onPress={() => navigation.navigate('Feed')}>
                          <View style={s.videoThumbWrap}>
                            <Image source={{ uri: vid.img }} style={s.thumbImage} />
                            <View style={s.thumbDark} />
                            <View style={s.favoriteDot}>
                              <MaterialIcons name="favorite" size={14} color="#cd2bee" />
                            </View>
                          </View>
                          <Text style={[s.gridTitle, { color: theme.text }]} numberOfLines={1}>{vid.title}</Text>
                          <Text style={[s.gridMeta, { color: theme.textSecondary }]}>{vid.artist}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'Premium' && (
                <View style={s.sectionGroup}>
                  {!selectedCreator ? (
                    <View style={s.sectionBlock}>
                      <Text style={[s.sectionEyebrow, { color: theme.textSecondary }]}>Subscribed Creators</Text>
                      <View style={s.listWrap}>
                        {subscribedCreators.map((creator) => (
                          <Pressable key={creator.id} onPress={() => setSelectedCreator(creator.id)} style={[s.listCard, { backgroundColor: isDark ? '#111827' : theme.card, borderColor: theme.border }]}>
                            <View style={s.listLeft}>
                              <Image source={{ uri: creator.img }} style={s.listAvatar} />
                              <View>
                                <Text style={[s.listTitle, { color: theme.text }]}>{creator.name}</Text>
                                <Text style={[s.listMeta, { color: theme.textSecondary }]}>{creator.handle}</Text>
                              </View>
                            </View>
                            <View style={s.creatorRight}>
                              <Text style={s.creatorDropMeta}>{creator.premiumCount} Drops</Text>
                              <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={s.sectionGroup}>
                      <View style={s.vaultHeader}>
                        <Pressable onPress={() => setSelectedCreator(null)} style={s.backRow}>
                          <MaterialIcons name="arrow-back" size={14} color="#cd2bee" />
                          <Text style={s.backText}>Back to Creators</Text>
                        </Pressable>
                        <Text style={s.sectionEyebrow}>
                          {subscribedCreators.find((creator) => creator.id === selectedCreator)?.name}'s Vault
                        </Text>
                      </View>

                      <View style={s.sectionBlock}>
                        <Text style={s.sectionMini}>Premium Videos</Text>
                        <View style={s.twoColGrid}>
                          {premiumContent[selectedCreator].videos.map((vid) => (
                            <Pressable key={vid.id} style={s.gridCard} onPress={() => navigation.navigate('Feed')}>
                              <View style={s.videoThumbWrap}>
                                <Image source={{ uri: vid.img }} style={s.thumbImage} />
                                <View style={s.thumbDark} />
                                <View style={s.premiumTag}>
                                  <Text style={s.premiumTagText}>Premium</Text>
                                </View>
                              </View>
                          <Text style={[s.gridTitle, { color: theme.text }]} numberOfLines={1}>{vid.title}</Text>
                        </Pressable>
                      ))}
                        </View>
                      </View>

                      <View style={s.sectionBlock}>
                        <Text style={s.sectionMini}>Playlists</Text>
                        <View style={s.twoColGrid}>
                          {premiumContent[selectedCreator].playlists.map((playlist) => (
                            <Pressable key={playlist.id} style={s.gridCard} onPress={() => navigation.navigate('Feed')}>
                              <View style={s.squareThumbWrap}>
                                <Image source={{ uri: playlist.img }} style={s.thumbImage} />
                                <View style={s.squareDark} />
                                <View style={s.playCenter}>
                                  <View style={s.playButton}>
                                    <MaterialIcons name="playlist-play" size={22} color="#fff" />
                                  </View>
                                </View>
                                <View style={s.playlistCount}>
                                  <Text style={s.playlistCountText}>{playlist.count} Items</Text>
                                </View>
                              </View>
                          <Text style={[s.gridTitle, { color: theme.text }]} numberOfLines={1}>{playlist.title}</Text>
                        </Pressable>
                      ))}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'Video' && (
                <View style={s.twoColGrid}>
                  {[1, 2, 3, 4].map((item) => (
                    <Pressable key={item} style={s.gridCard} onPress={() => navigation.navigate('Feed')}>
                      <View style={s.verticalThumbWrap}>
                        <Image source={{ uri: `https://picsum.photos/seed/vid${item}/300/533` }} style={s.thumbImage} />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.66)']} style={StyleSheet.absoluteFillObject} />
                        <View style={s.verticalMeta}>
                          <MaterialIcons name="play-circle" size={16} color="#fff" />
                          <Text style={s.verticalMetaText}>2.4K views</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {activeTab === 'Tickets' && (
                <View style={s.listWrap}>
                  {[1, 2].map((item) => (
                    <Pressable key={item} onPress={() => navigation.navigate('FanSettings', { view: 'identity', fromProfile: true })} style={s.ticketCard}>
                      <View style={s.ticketLeft}>
                        <View style={s.ticketIconWrap}>
                          <MaterialIcons name="local-activity" size={24} color="#cd2bee" />
                        </View>
                        <View>
                          <Text style={[s.ticketTitle, { color: theme.text }]}>Summer Festival 2024</Text>
                          <Text style={[s.ticketMeta, { color: theme.textSecondary }]}>Aug 24 - O2 Arena</Text>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              )}

              {activeTab === 'Saved' && (
                <View style={s.twoColGrid}>
                  {[1, 2, 3, 4].map((item) => (
                    <Pressable key={item} style={s.gridCard}>
                      <View style={s.squareThumbWrap}>
                        <Image source={{ uri: `https://picsum.photos/seed/saved${item}/400/400` }} style={s.thumbImage} />
                        <View style={s.savedBadge}>
                          <MaterialIcons name="bookmark" size={14} color="#cd2bee" />
                        </View>
                      </View>
                      <Text style={[s.gridTitle, { color: theme.text }]}>Saved Collection Item</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#060913',
  },
  content: {
    paddingBottom: 120,
  },
  coverSection: {
    marginBottom: 14,
  },
  cover: {
    height: 256,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  profileRow: {
    marginTop: -46,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 30,
    borderWidth: 6,
    
  },
  streakBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f97316',
    borderWidth: 4,
    // borderColor: '#060913',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    marginTop: 1,
  },
  nameWrap: {
    paddingBottom: 10,
  },
  name: {
    color: '#fff',
    fontSize: mediumScreen ? 25 : 21,
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  member: {
    color: '#cd2bee',
    fontSize: 10,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginTop: 2,
  },
  main: {
    paddingHorizontal: 18,
    gap: 24,
  },
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  vibeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(205,43,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.24)',
  },
  vibeText: {
    color: '#cd2bee',
    fontSize: 9,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  vibeEdit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    color: '#fff',
    fontSize: mediumScreen ? 28 : 24,
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  statLabel: {
    color: '#8f95af',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  actionSection: {
    gap: 14,
  },
  switchRoleCard: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  switchRoleGradient: {
    minHeight: 88,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRoleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  switchRoleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRoleTitle: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  switchRoleMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9,
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 3,
  },
  tabsSection: {
    gap: 18,
  },
  tabsRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabButton: {
    minWidth: 72,
    alignItems: 'center',
    paddingBottom: 12,
    marginRight: 12,
  },
  tabText: {
    color: '#6b7280',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tabTextActive: {
    color: '#cd2bee',
  },
  tabIndicator: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: -1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  tabContent: {
    gap: 18,
  },
  sectionGroup: {
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionEyebrow: {
    color: '#71788f',
    fontSize: 9,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  sectionMini: {
    color: '#71788f',
    fontSize: 9,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  listWrap: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  listTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
  },
  listMeta: {
    color: '#8f95af',
    fontSize: 10,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  creatorDropMeta: {
    color: '#cd2bee',
    fontSize: 10,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  gridCard: {
    width: '47%',
    gap: 8,
  },
  videoThumbWrap: {
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  verticalThumbWrap: {
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  squareThumbWrap: {
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  squareDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  favoriteDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  premiumTagText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCount: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  playlistCountText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verticalMeta: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verticalMetaText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  gridTitle: {
    color: '#d7dbea',
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
  },
  gridMeta: {
    color: '#8f95af',
    fontSize: 8,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  vaultHeader: {
    gap: 10,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#cd2bee',
    fontSize: 10,
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(205,43,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  ticketMeta: {
    color: '#8f95af',
    fontSize: 10,
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  savedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FanProfile;
