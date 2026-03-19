import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { darkMode, mediumScreen } from '../types';

const Discover: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState('All');
  const [isDarkMode, setDarkMode] = useState(false);
  const categories = ['All', 'Creators', 'Videos', 'Events', 'Shorts'];

  const artists = [
    { name: 'Luna Ray', fans: '1.2M Fans', img: 'https://picsum.photos/seed/art1/150/150' },
    { name: 'The Glitch', fans: '850K Fans', img: 'https://picsum.photos/seed/art2/150/150' },
    { name: 'Echo Vibe', fans: '2.1M Fans', img: 'https://picsum.photos/seed/art3/150/150' },
  ];

  const featuredClips = [
    { id: 'v1', title: 'Midnight Soul Session', artist: 'Elena Rose', views: '1.2M', img: 'https://picsum.photos/seed/vid1/400/225' },
    { id: 'v2', title: 'Summer Tour BTS', artist: 'Burna Boy', views: '840K', img: 'https://picsum.photos/seed/vid2/400/225' },
  ];

  const featuredMerch = [
    { id: 'm1', name: 'Ethereal Vinyl (Limited)', artist: 'Elena Rose', price: '$45.00', img: 'https://picsum.photos/seed/merch1/300' },
    { id: 'm2', name: 'Nebula Oversized Hoodie', artist: 'Zion King', price: '$65.00', img: 'https://picsum.photos/seed/merch2/300' },
    { id: 'm3', name: 'Starboy Production Stems', artist: 'Mila Ray', price: '$25.00', img: 'https://picsum.photos/seed/merch3/300' },
    { id: 'm4', name: 'Galaxy Tour Pass', artist: 'Echo Vibe', price: '$120.00', img: 'https://picsum.photos/seed/merch4/300' },
  ];

  const upcomingEvents = [
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

  useEffect(()=>{
    setDarkMode(darkMode)
  }, [darkMode])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: isDarkMode ?'#000': '#fff' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View 
        style = {{
          backgroundColor: '#1f1022',
        }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back-ios" size={20} color="white" />
          </Pressable>
          <Text style={{ color: 'white', fontSize: mediumScreen?22:18, fontWeight: '700' }}>Discover</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{
          marginTop: 12,
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 12, paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          }}>
          <MaterialIcons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput placeholder="Search creators, videos, or events..." placeholderTextColor="#94a3b8" style={{ color: 'white' }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: activeCategory === cat ? '#cd2bee' : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'white', fontSize: mediumScreen?16:11, fontWeight: '700', fontFamily: "PlusJakartaSans" }}>{cat.toUpperCase()}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      </View>
      

      <View style={{ paddingHorizontal: 16, gap: 24 }}>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
            <Text style={{ color: 'white', fontSize: mediumScreen?19:15, fontWeight: 'bold', fontFamily: "Plus Jakarta Sans"}}>HOT TICKETS</Text>
            <Pressable>
              <Text style={{ color: '#cd2bee', fontSize: mediumScreen?15:11, fontWeight: 'bold', fontFamily: "Plus Jakarta Sans" }}>FULL CALENDER</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {upcomingEvents.map((event) => (
              <Pressable key={event.id} onPress={() => navigation.navigate('Video')} style={{ width: 320 }}>
                <View style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: '#111827', height: 300}}>
                  <Image source={{ uri: event.img }} style={{ width: '100%', height: "100%" }} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 12,
                    justifyContent: 'flex-end', // put text at bottom
                  }}
                  >
                    <View style={{ }}>
                    <Text 
                    numberOfLines={2}
                    style={{ 
                      color: '#cd2bee',
                      marginTop: 4,
                      fontSize: mediumScreen?16:12,
                      width: "75%",
                      fontFamily: "Plus Jakarta Sans",
                      fontWeight: "bold",
                      lineHeight: 10,
                      letterSpacing: 1.5,
                      textAlign: 'left'
                      
                       }}>
                      {event.date.toUpperCase()} • {event.location.toUpperCase()}
                    </Text>
                    <Text 
                    numberOfLines={2}
                    style={{ 
                      color: 'white',
                      fontSize: mediumScreen?21:17,
                      fontWeight: '800',
                      marginTop: 4,
                      textAlign: 'left',
                      fontFamily: "Plus Jakarta Sans",
                      width: "75%",
                       }}>{event.title.toUpperCase()}</Text>
                    <View style= {{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      // backgroundColor: 'transparent',
                    }}>
                      <Text style={{ color: '#888', fontSize: mediumScreen?14:10, marginTop: 4, fontWeight: "bold", fontFamily: "Plus Jakarta Sans" }}>FROM</Text>
                      <Text style={{ color: 'white', fontSize: mediumScreen?22:18, marginTop: 0, fontWeight: "bold", fontFamily: "Plus Jakarta Sans"  }}>{event.price}</Text>
                    </View>
                  </View>
                  </LinearGradient>
                  <View style = {{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    backgroundColor: 'transparent',
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    // paddingVertical: 4,
                    borderColor: '#888',
                    borderWidth: 1,
                    height: 30,
                    // width: 110,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexDirection: 'row',
                    }}>
                  <View
                  style = {{
                    backgroundColor: '#cd2bee',
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    
                  }}></View>
                  <View>
                    <Text style={{ 
                      color: '#cd2bee',
                      fontSize: mediumScreen?13: 9,
                      fontWeight: '700',
                      marginLeft: 6,
                      }}>{event.tag}</Text>
                  </View>
                  </View>
                  
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: 'white', fontSize: mediumScreen?18:14, fontWeight: "bold", fontFamily: "Plus Jakarta Sans",  }}>TRENDING VIDEO</Text>
            <Pressable>
              <Text style={{ color: '#cd2bee', fontSize: mediumScreen?15:11, fontWeight: "bold", fontFamily: "Plus Jakarta Sans" }}>SEE ALL</Text>
            </Pressable>
          </View>
          <View style={{ gap: 12 }}>
            {featuredClips.map((vid) => (
              <Pressable key={vid.id} onPress={() => navigation.navigate('Video')}>
                <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#111827',height: 270}}>
                  <Image source={{ uri: vid.img }} style={{ width: '100%', height: "100%"}} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 12,
                    // justifyContent: 'flex-end', 
                  }}
                  />
                  <View style={{ 
                    padding: 12,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                     }}>
                    <Text style={{ color: 'white', fontSize: mediumScreen?21:17, fontWeight: 'bold', fontFamily: "Plus Jakarta Sans" }}>{vid.title.toUpperCase()}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: mediumScreen?15:11, marginTop: 4, fontWeight: "bold", fontFamily: "Plus Jakarta Sans" }}>
                      {vid.artist.toUpperCase()} - {vid.views.toUpperCase()} VIEWS
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: 'white', fontSize: mediumScreen?18:14, fontWeight: 'bold', fontFamily: "Plus Jakarta Sans" }}>CREATOR ONLINE STORE</Text>
            <Pressable>
              <Text style={{ color: '#cd2bee', fontSize: mediumScreen?15:11, fontWeight: "bold", fontFamily: "Plus Jakarta Sans" }}>BROWSE ALL</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {featuredMerch.map((item) => (
              <Pressable key={item.id} style={{ width: 170, }} onPress={() => navigation.navigate('Video')}>
                <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: '#111827' }}>
                  <Image source={{ uri: item.img }} style={{ width: '100%', aspectRatio: 1 }} />
                  <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#cd2bee', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: 'white', fontSize: mediumScreen?14:10, fontWeight: '700' }}>{item.price}</Text>
                  </View>
                </View>
                <View>
                   <View style={{ padding: 10 }}>
                    <Text style={{ color: 'white', fontSize: mediumScreen?12:8, fontWeight: 'bold', fontFamily: "Plus Jakarta Sans" }}>{item.name.toUpperCase()}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: mediumScreen?10:6, marginTop: 4, fontWeight: 'bold', fontFamily: "Plus Jakarta Sans" }}>{item.artist.toUpperCase()}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: 'white', fontSize: mediumScreen?18:14, fontWeight: 'bold' }}>TOP CREATORS</Text>
            <Pressable>
              <Text style={{ color: '#cd2bee', fontSize: mediumScreen?15:11, fontFamily: "Plus Jakarta Sans", fontWeight: "bold" }}>VIEW ALL</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {artists.map((artist) => (
              <Pressable key={artist.name} onPress={() => navigation.navigate('Video')} style={{ alignItems: 'center', width: 96 }}>
                <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderColor: 'white',
                borderWidth: 2.5,
                padding: 4,
                marginTop: 8,
                // backgroundColor: '#cd2bee',
                // backgroundColor : '#1e293b',
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
              </View>
                {/* <Image source={{ uri: artist.img }} style={{ width: 74, height: 74, borderRadius: 37, marginBottom: 8 }} /> */}
                <Text style={{ color: 'white', fontSize: mediumScreen?14:10, fontWeight: 'bold', marginTop: 4}} numberOfLines={1}>
                  {artist.name.toUpperCase()}
                </Text>
                <Text style={{ color: '#94a3b8', fontSize: mediumScreen?12:8, fontWeight: 'bold' }} numberOfLines={1}>
                  {artist.fans.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default Discover;
