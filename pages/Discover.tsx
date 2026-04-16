import React, { useEffect, useState } from 'react';
import { useThemeMode } from '../theme';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { mediumScreen } from '../types';
import { fontScale } from '../fonts';

type Artist = {
  name: string;
  fans: string;
  img: string;
};

type SoundMeta = {
  id: string;
  title: string;
  artist: string;
  usageCount: number;
  duration: string;
  cover: string;
};

type FeaturedClip = {
  id: string;
  title: string;
  artist: string;
  views: string;
  img: string;
  sound?: SoundMeta;
};

type MerchItem = {
  id: string;
  name: string;
  artist: string;
  price: string;
  img: string;
};

type EventItem = {
  id: string;
  title: string;
  artist: string;
  date: string;
  location: string;
  img: string;
  price: string;
  tag: string;
};

const Discover: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Creators', 'Videos', 'Events', 'Shorts'];
  const headerBackground = isDark ? '#1f1022' : theme.card;
  const glassSurface = isDark ? 'rgba(255,255,255,0.08)' : theme.surface;
  const softBorder = isDark ? 'rgba(255,255,255,0.05)' : theme.border;
  const cardBackground = isDark ? '#111827' : theme.card;
  const iconTint = isDark ? '#94a3b8' : theme.textSecondary;
  const overlayMusicSurface = isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.92)';
  const overlayMusicBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;

  const artists: Artist[] = [
    { name: 'Luna Ray', fans: '1.2M Fans', img: 'https://picsum.photos/seed/art1/150/150' },
    { name: 'The Glitch', fans: '850K Fans', img: 'https://picsum.photos/seed/art2/150/150' },
    { name: 'Echo Vibe', fans: '2.1M Fans', img: 'https://picsum.photos/seed/art3/150/150' },
    { name: 'Elena Rose', fans: '3.4M Fans', img: 'https://picsum.photos/seed/mila/150/150' },
    { name: 'Zion King', fans: '920K Fans', img: 'https://picsum.photos/seed/zion/150/150' },
    { name: 'Burna Boy', fans: '15M Fans', img: 'https://picsum.photos/seed/burna/150/150' },
  ];

  const featuredClips: FeaturedClip[] = [
    {
      id: 'v1',
      title: 'Midnight Soul Session',
      artist: 'Elena Rose',
      views: '1.2M',
      img: 'https://picsum.photos/seed/vid1/400/225',
      sound: {
        id: 's1',
        title: 'Neon Dreams',
        artist: 'Synthwave Kid',
        usageCount: 12400,
        duration: '0:30',
        cover: 'https://picsum.photos/seed/s1/100',
      },
    },
    {
      id: 'v2',
      title: 'Summer Tour BTS',
      artist: 'Burna Boy',
      views: '840K',
      img: 'https://picsum.photos/seed/vid2/400/225',
      sound: {
        id: 's2',
        title: 'Midnight City',
        artist: 'Urban Echo',
        usageCount: 8500,
        duration: '0:15',
        cover: 'https://picsum.photos/seed/s2/100',
      },
    },
  ];

  const featuredMerch: MerchItem[] = [
    { id: 'm1', name: '1000 Kulsah Coins', artist: 'Kulsah Official', price: '$9.99', img: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=400' },
    { id: 'm2', name: 'Fan Sticker Pack', artist: 'Kulsah Official', price: '$4.99', img: 'https://images.unsplash.com/photo-1572375927902-e60e87bb7385?auto=format&fit=crop&q=80&w=800' },
    { id: 'm3', name: 'Buy Coffee for Elena', artist: 'Elena Rose', price: '$5.00', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400' },
    { id: 'm4', name: 'Season Sticker', artist: 'Zion King', price: '$14.99', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400' },
  ];

  const upcomingEvents: EventItem[] = [
    {
      id: 'burna-boy',
      title: 'Love, Damini World Tour',
      artist: 'Burna Boy',
      date: 'Aug 24',
      location: 'O2 Arena, London',
      img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800',
      price: '$125+',
      tag: 'On-Air Live',
    },
    {
      id: 'elena-rose',
      title: 'Ethereal Soul Experience',
      artist: 'Elena Rose',
      date: 'Sep 12',
      location: 'The Fillmore, San Francisco',
      img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
      price: '$85+',
      tag: 'Exclusive View',
    },
    {
      id: 'afro-fest',
      title: 'Afro-Cinema Fest 2024',
      artist: 'Multiple Creators',
      date: 'Oct 05',
      location: 'National Theatre, Lagos',
      img: 'https://images.unsplash.com/photo-1546707012-c51841275c6f?auto=format&fit=crop&q=80&w=800',
      price: '$45+',
      tag: 'Festival',
    },
  ];

  return (
    <ScrollView
    bounces={false}
    showsVerticalScrollIndicator={false}
    style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View
        style={{
          backgroundColor: headerBackground,
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 22, paddingBottom: 12 }}>
          {!embedded ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: glassSurface,
                  borderWidth: 1,
                  borderColor: softBorder,
                }}
              >
                <MaterialIcons name="chevron-left" size={20} color={theme.text} />
              </Pressable>
              <Text style={{ color: theme.text, fontSize: mediumScreen ? 22 : 18, fontWeight: '700', fontFamily: 'PlusJakartaSansBold' }}>Discover</Text>
              <View style={{ width: 40 }} />
            </View>
          ) : null}

          <View
            style={{
              marginTop: embedded ? 0 : 12,
              backgroundColor: glassSurface,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: softBorder,
            }}
          >
            <MaterialIcons name="search" size={18} color={iconTint} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search creators, videos, or events..."
              placeholderTextColor={theme.textSecondary}
              style={{ color: theme.text, flex: 1, fontFamily: 'PlusJakartaSans' }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginTop: 14 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: activeCategory === cat ? '#cd2bee' : glassSurface,
                  borderWidth: activeCategory === cat ? 0 : 1,
                  borderColor: softBorder,
                }}
              >
                <Text style={{ color: activeCategory === cat ? '#fff' : theme.text, fontSize: mediumScreen ? 14 : 11, fontWeight: '700', fontFamily: 'PlusJakartaSansBold' }}>
                  {cat.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={{  gap: 24 }}>
        {(activeCategory === 'All' || activeCategory === 'Creators') && (
          <View>
            <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontSize: mediumScreen ? 16 : 12, fontWeight: 'bold', fontFamily: 'PlusJakartaSansExtraBold' }}>TOP CREATORS</Text>
              <Pressable>
                <Text style={{ color: '#cd2bee', fontSize: mediumScreen ? 14 : 10, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }}>VIEW ALL</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingVertical: 4 }}>
              {artists.map((artist) => (
                <Pressable key={artist.name} onPress={() => navigation.navigate('ArtistProfile')} style={{ alignItems: 'center', width: 104 }}>
                  <View
                    style={{
                      width: 86,
                      height: 86,
                      borderRadius: 43,
                      borderColor: 'rgba(205,43,238,0.35)',
                      borderWidth: 2,
                      padding: 4,
                    }}
                  >
                    <Image
                      source={{ uri: artist.img }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 40,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        right: 2,
                        bottom: 2,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: '#cd2bee',
                        borderWidth: 2,
                        borderColor: theme.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="verified" size={14} color="white" />
                    </View>
                  </View>
                  <Text style={{ color: theme.text, fontSize: mediumScreen ? 14 : 10, fontWeight: 'bold', marginTop: 10, fontFamily: 'PlusJakartaSansBold' }} numberOfLines={1}>
                    {artist.name.toUpperCase()}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: mediumScreen ? 12 : 8, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }} numberOfLines={1}>
                    {artist.fans.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {(activeCategory === 'All' || activeCategory === 'Events') && (
          <View>
            <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
              <Text style={{ color: theme.text, fontSize: mediumScreen ? 16 : 12, fontWeight: 'bold', fontFamily: 'PlusJakartaSansExtraBold' }}>HOT TICKETS</Text>
              <Pressable>
                <Text style={{ color: '#cd2bee', fontSize: mediumScreen ? 14 : 10, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }}>FULL CALENDAR</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }}>
              {upcomingEvents.map((event) => (
                <Pressable key={event.id} onPress={() => navigation.navigate('Community')} style={{ width: 320 }}>
                  <View style={{ borderRadius: 32, overflow: 'hidden', backgroundColor: cardBackground, height: 300, borderWidth: 1, borderColor: theme.border }}>
                    <Image source={{ uri: event.img }} style={{ width: '100%', height: '100%', opacity: 0.7 }} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.95)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: 18,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <View>
                        <Text
                          numberOfLines={2}
                          style={{
                            color: '#cd2bee',
                            marginTop: 4,
                            fontSize: mediumScreen ? 14 : 10,
                            width: '72%',
                            fontFamily: 'PlusJakartaSansExtraBold',
                            letterSpacing: 1.6,
                          }}
                        >
                          {`${event.date.toUpperCase()} - ${event.location.toUpperCase()}`}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={{
                            color: 'white',
                            fontSize: mediumScreen ? 23 : 18,
                            fontWeight: '800',
                            marginTop: 8,
                            fontFamily: 'PlusJakartaSansExtraBold',
                            width: '72%',
                          }}
                        >
                          {event.title.toUpperCase()}
                        </Text>
                        <View style={{ position: 'absolute', bottom: 2, right: 0 }}>
                          <Text style={{ color: isDark ? '#888' : theme.textSecondary, fontSize: mediumScreen ? 12 : 9, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }}>FROM</Text>
                          <Text style={{ color: 'white', fontSize: mediumScreen ? 22 : 18, fontWeight: 'bold', fontFamily: 'PlusJakartaSansExtraBold' }}>
                            {event.price}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>

                    <View
                      style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        height: 34,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        backgroundColor: 'rgba(205,43,238,0.12)',
                        borderColor: 'rgba(205,43,238,0.35)',
                        borderWidth: 1,
                      }}
                    >
                      <View style={{ backgroundColor: '#cd2bee', width: 8, height: 8, borderRadius: 4 }} />
                      <Text style={{ color: 'white', fontSize: mediumScreen ? 11 : 9, fontWeight: '700', marginLeft: 8, fontFamily: 'PlusJakartaSansBold' }}>
                        {event.tag.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {(activeCategory === 'All' || activeCategory === 'Videos' || activeCategory === 'Shorts') && (
          <View>
            <View style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
              <Text style={{ color: theme.text, fontSize: mediumScreen ? 18 : 14, fontWeight: 'bold', fontFamily: 'PlusJakartaSansExtraBold' }}>TRENDING VIDEO</Text>
              <Pressable>
                <Text style={{ color: '#cd2bee', fontSize: mediumScreen ? 15 : 11, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }}>SEE ALL</Text>
              </Pressable>
            </View>
            <View style={{ gap: 16, paddingHorizontal: 16 }}>
              {featuredClips.map((vid) => (
                <Pressable key={vid.id} onPress={() => navigation.navigate('Feed')}>
                  <View style={{ borderRadius: 28, overflow: 'hidden', backgroundColor: cardBackground, height: 270, borderWidth: 1, borderColor: theme.border }}>
                    <Image source={{ uri: vid.img }} style={{ width: '100%', height: '100%', opacity: 0.75 }} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.92)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    />
                    <View
                      style={{
                        padding: 16,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: mediumScreen ? 21 : 17, fontWeight: 'bold', fontFamily: 'PlusJakartaSansExtraBold' }}>
                        {vid.title.toUpperCase()}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: mediumScreen ? 13 : 10, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold', flex: 1 }}>
                          {`${vid.artist.toUpperCase()} - ${vid.views.toUpperCase()} VIEWS`}
                        </Text>
                        {vid.sound && (
                          <Pressable
                            onPress={() => navigation.navigate('UploadContent')}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              backgroundColor: overlayMusicSurface,
                              borderRadius: 10,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              borderWidth: 1,
                              borderColor: overlayMusicBorder,
                            }}
                          >
                            <MaterialIcons name="music-note" size={12} color="#cd2bee" />
                            <Text style={{ color: isDark ? 'white' : theme.text, fontSize: fontScale(9), fontFamily: 'PlusJakartaSansBold' }} numberOfLines={1}>
                              {vid.sound.title.toUpperCase()}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {(activeCategory === 'All' || activeCategory === 'Creators') && (
          <View style={{ paddingBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 4, paddingHorizontal: 16 }}>
              <Text style={{ color: theme.text, fontSize: mediumScreen ? 18 : 14, fontWeight: 'bold', fontFamily: 'PlusJakartaSansExtraBold' }}>KULSAH STORE</Text>
              <Pressable onPress={() => navigation.navigate('CreateContent')}>
                <Text style={{ color: '#cd2bee', fontSize: mediumScreen ? 15 : 11, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }}>BROWSE ALL</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {featuredMerch.map((item) => (
                <Pressable key={item.id} style={{ width: 180 }} onPress={() => navigation.navigate('CreateContent')}>
                  <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: cardBackground, borderWidth: 1, borderColor: theme.border }}>
                    <Image source={{ uri: item.img }} style={{ width: '100%', aspectRatio: 1 }} />
                    <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#cd2bee', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: 'white', fontSize: mediumScreen ? 12 : 10, fontWeight: '700', fontFamily: 'PlusJakartaSansBold' }}>{item.price}</Text>
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.78)',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.3)' : theme.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name="shopping-bag" size={20} color={isDark ? 'white' : theme.text} />
                      </View>
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ color: theme.text, fontSize: mediumScreen ? 12 : 9, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }} numberOfLines={1}>
                      {item.name.toUpperCase()}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: mediumScreen ? 10 : 7, marginTop: 4, fontWeight: 'bold', fontFamily: 'PlusJakartaSansBold' }} numberOfLines={1}>
                      {item.artist.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      <View style={{
        height: 100,
      }}/>
    </ScrollView>
  );
};

export default Discover;

