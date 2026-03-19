import React, { useState } from 'react';
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
import { user } from './types';

interface FanProfileProps {
  onLogout?: () => void;
  onToggleRole?: () => void;
}

type ProfileTab = 'Favorites' | 'Collections' | 'Recent';

const FanProfile: React.FC<FanProfileProps> = ({ onToggleRole, }) => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('Favorites');

  const stats = [
    { label: 'Supporting', value: '24', path: '/fan/subscriptions' },
    { label: 'Unlocked', value: '12', path: '/fan/premium' },
    { label: 'Attending', value: '2', path: '/fan/settings' },
  ];

  const vibes = ['Afrobeats', 'Synthwave', 'Midnight R&B'];

  const favorites = [
    { name: 'Elena Rose', img: 'https://picsum.photos/seed/elena/150', handle: '@elena_r' },
    { name: 'Zion King', img: 'https://picsum.photos/seed/zion/150', handle: '@zion_k' },
    { name: 'Amara', img: 'https://picsum.photos/seed/amara/150', handle: '@amara_v' },
  ];

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.coverWrap}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
            }}
            style={s.cover}
          >
          <View style={s.coverOverlay}>
              <LinearGradient
            colors={['transparent', '#000']}
            style={{
              // padding: 2,
              // position: 'absolute',
              height: "100%",
              width: '100%'
            }}
            />
            </View>

            <View style={s.headerRow}>
              <Pressable onPress={() => navigation.navigate('/feed')} style={s.iconBtn}>
                <MaterialIcons name="close" size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('FanSettings')} style={s.iconBtn}>
                <MaterialIcons name="settings" size={20} color="#fff" />
              </Pressable>
            </View>
          </ImageBackground>

          <View style={s.profileRow}>
            <View style={s.avatarStack}>
              <Image source={{ uri: 'https://picsum.photos/seed/profile/300' }} style={s.avatar} />
              <View style={s.badge}>
                <MaterialIcons name="stars" size={14} color="#fff" />
              </View>
            </View>
            <View style={s.nameWrap}>
              <Text style={s.name}>Alex Rivera</Text>
              <Text style={s.member}>Member #0042</Text>
            </View>
          </View>
        </View>

        <View style={s.main}>
          <View style={s.vibesRow}>
            {vibes.map((vibe) => (
              <View key={vibe} style={s.vibeChip}>
                <Text style={s.vibeText}>{vibe}</Text>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('/vibe-picker')} style={s.vibeEdit}>
              <MaterialIcons name="edit" size={14} color="#9aa0b6" />
            </Pressable>
          </View>

          <View style={s.statsGrid}>
            {stats.map((stat) => (
              <Pressable key={stat.label} onPress={() => navigation.navigate(stat.path)} style={s.statCard}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.primaryActions}>
            <View style={s.primaryRow}>
              <Pressable
                onPress={() => navigation.navigate('/fan/settings', { view: 'identity' })}
                style={[s.actionCard, s.actionCardPrimary]}
              >
                <View style={s.actionIconWrapPrimary}>
                  <MaterialIcons name="qr-code-scanner" size={32} color="#fff" />
                </View>
                <View>
                  <Text style={s.actionTitlePrimary}>Identity{"\n"}Pass</Text>
                  <Text style={s.actionMetaPrimary}>2 Tickets Active</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('/fan/premium')}
                style={[s.actionCard, s.actionCardGhost]}
              >
                <View style={s.actionIconWrapGhost}>
                  <View style={{
                    borderWidth: 3,
                    borderColor: '#cd2bee',
                    height: 28,
                    width: 28,
                    borderRadius: 19,
                    justifyContent: 'center',
                    alignItems: 'center',
                     }}>
                    <MaterialIcons name="star" size={18} color="#cd2bee" />
                  </View>
                </View>
                <View>
                  <Text style={s.actionTitleGhost}>Subscriber Premium</Text>
                  <Text style={s.actionMetaGhost}>12 Items Unlocked</Text>
                </View>
              </Pressable>
            </View>

            <Pressable onPress={async()=>{
              await AsyncStorage.setItem('pulsar_user', JSON.stringify({...user, role: 'creator'}));
              // navigation.navigate(`Settings`)
            }
              } style={s.switchRole}>
              <LinearGradient
                colors={['#6b21a8', '#cd2bee']}
                locations={[0,0.8]}
                start = {{
                  x : 0,
                  y : 0,
                }}
                end={{ x: 1, y: 0 }}
                style={{
                  // padding: 2,
                  // position: 'absolute',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  height: "100%",
                  width: '100%',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  borderRadius: 24,
                }}
                >
                  <View style={s.switchRoleLeft}>
                <View style={s.switchRoleIcon}>
                  <MaterialIcons name="rocket-launch" size={24} color="#fff" />
                </View>
                <View>
                  <Text style={s.switchRoleTitle}>Switch to Creator</Text>
                  <Text style={s.switchRoleMeta}>Upload, Go Live & Monetize</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#fff" />
                </LinearGradient>
              
            </Pressable>
          </View>

          <View style={s.tabsWrap}>
            <View style={s.tabsRow}>
              {(['Favorites', 'Collections', 'Recent'] as ProfileTab[]).map((tab) => (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={s.tabBtn}>
                  <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
                  {activeTab === tab && <View style={s.tabIndicator} />}
                </Pressable>
              ))}
            </View>

            {activeTab === 'Favorites' && (
              <View style={s.listWrap}>
                {favorites.map((artist) => (
                  <Pressable
                    key={artist.handle}
                    onPress={() => navigation.navigate(`/profile/${artist.name}`)}
                    style={s.favRow}
                  >
                    <View style={s.favLeft}>
                      <Image source={{ uri: artist.img }} style={s.favAvatar} />
                      <View>
                        <Text style={s.favName}>{artist.name}</Text>
                        <Text style={s.favHandle}>{artist.handle}</Text>
                      </View>
                    </View>
                    <View style={s.favRight}>
                      <MaterialIcons name="stars" size={18} color="#cd2bee" />
                      <MaterialIcons name="chevron-right" size={20} color="#666d88" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {activeTab === 'Collections' && (
              <View style={s.collectionsGrid}>
                {[1, 2].map((i) => (
                  <Pressable key={i} style={s.collectionCard} onPress={() => navigation.navigate('/premium')}>
                    <View style={s.collectionImageWrap}>
                      <Image source={{ uri: `https://picsum.photos/seed/coll${i}/400/225` }} style={s.collectionImage} />
                      <View style={s.collectionOverlay} />
                      <View style={s.premiumTag}>
                        <Text style={s.premiumTagText}>Premium</Text>
                      </View>
                    </View>
                    <Text style={s.collectionTitle}>Exclusive Asset #{i + 102}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {activeTab === 'Recent' && (
              <View style={s.recentEmpty}>
                <MaterialIcons name="history" size={20} color="#818398" />
                <Text style={s.recentEmptyText}>Recent activity will appear here.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 120 },
  coverWrap: { marginBottom: 18,  },
  cover: { height: 240, justifyContent: 'space-between' },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: '#00000055',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 48,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1022bf',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  profileRow: {
    marginTop: -38,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  avatarStack: { position: 'relative' },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#060913',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#cd2bee',
    borderWidth: 3,
    borderColor: '#060913',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWrap: { paddingBottom: 8 },
  name: { color: '#fff', fontSize: 24, fontWeight: '900' },
  member: {
    color: '#cd2bee',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    marginTop: 2,
  },
  main: { paddingHorizontal: 18, gap: 24 },
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  vibeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
  },
  vibeText: {
    color: '#cd2bee',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vibeEdit: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#ffffff12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  statCard: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ffffff14',
    backgroundColor: '#1f1022bf',
  },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statLabel: {
    color: '#94a3b8',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 3,
  },
  primaryActions: { gap: 12 },
  primaryRow: { flexDirection: 'row', gap: 10, marginTop: 15},
  actionCard: {
    flex: 1,
    borderRadius: 28,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-around',
  },
  actionCardPrimary: {
    backgroundColor: '#cd2bee',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  actionCardGhost: {
    backgroundColor: '#1f1022bf',
    borderWidth: 1,
    borderColor: '#ffffff1c',
  },
  actionIconWrapPrimary: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#ffffff2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapGhost: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1f1022bf',
    borderWidth: 1,
    borderColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitlePrimary: { color: '#fff', fontSize: 14, fontWeight: '900' },
  actionMetaPrimary: {
    color: '#ffffffbb',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  actionTitleGhost: { color: '#fff', fontSize: 14, fontWeight: '900' },
  actionMetaGhost: {
    color: '#8f95af',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  switchRole: {
    width: '100%',
    minHeight: 76,
    borderRadius: 24,
    borderColor: '#ffffff2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25
  },
  switchRoleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchRoleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff25',
    borderWidth: 1,
    borderColor: '#ffffff38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRoleTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  switchRoleMeta: {
    color: '#ffffffc2',
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  tabsWrap: { gap: 14, marginTop: 20},
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff14',
    marginBottom: 25
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingBottom: 10, position: 'relative' },
  tabText: {
    color: '#8f95af',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    
  },
  tabTextActive: { color: '#cd2bee', letterSpacing: 2, },
  tabIndicator: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: -1,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  listWrap: { gap: 10 },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ffffff14',
    backgroundColor: '#1f1022bf',
  },
  favLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  favAvatar: { width: 52, height: 52, borderRadius: 14 },
  favName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  favHandle: {
    color: '#8f95af',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  favRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  collectionsGrid: { flexDirection: 'row', gap: 10 },
  collectionCard: { flex: 1, gap: 8 },
  collectionImageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 100,
  },
  collectionImage: { width: '100%', height: '100%' },
  collectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000038',
  },
  premiumTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  premiumTagText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  collectionTitle: { color: '#d4d6e6', fontSize: 12, fontWeight: '700' },
  recentEmpty: {
    minHeight: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffffff14',
    backgroundColor: '#ffffff06',
  },
  recentEmptyText: { color: '#818398', fontSize: 12 },
});

export default FanProfile;
