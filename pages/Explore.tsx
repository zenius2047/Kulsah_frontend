import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const ElephantLogo = ({ className = "size-6" }: { className?: string }) => (
  <View viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <View d="M21,11 C21,8.23857625 18.7614237,6 16,6 L14,6 C13.4477153,6 13,5.55228475 13,5 C13,4.44771525 13.4477153,4 14,4 L16,4 C16.5522847,4 17,3.55228475 17,3 C17,2.44771525 16.5522847,2 16,2 L14,2 C11.2385763,2 9,4.23857625 9,7 L9,10 C9,11.1045695 8.1045695,12 7,12 L3,12 L3,22 L10,22 L10,18 C10,16.8954305 10.8954305,16 12,16 L14,16 C15.1045695,16 16,16.8954305 16,18 L16,22 L21,22 L21,11 Z" />
  </View>
);

interface ExploreProps {
  onLogout?: () => void;
}

const Explore: React.FC<ExploreProps> = ({ onLogout }) => {
  const navigation = useNavigation<any>();

  const vibes = [
    { name: 'Afro-Cinema', stats: '1.2M Viewing', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400' },
    { name: 'Live Concerts', stats: '850K Viewing', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400' },
    { name: 'Vlogs', stats: '3.5M Viewing', img: 'https://images.unsplash.com/photo-1546707012-c51841275c6f?auto=format&fit=crop&q=80&w=400' },
    { name: 'Neon Art', stats: '420K Viewing', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400' },
  ];

  const creators = [
    { name: 'Amara', status: 'LIVE', img: 'https://picsum.photos/seed/p1/150/150' },
    { name: 'Zion King', status: '140k subs', img: 'https://picsum.photos/seed/p2/150/150' },
    { name: 'Lila Moon', status: 'LIVE', img: 'https://picsum.photos/seed/p3/150/150' },
    { name: 'DJ Kay-T', status: '92k subs', img: 'https://picsum.photos/seed/p4/150/150' },
  ];

  return (
    <View>
      <View>
        <View>
          <View>
            <View aria-hidden="true">
              <ElephantLogo />
            </View>
            <Text>KULSAH</Text>
          </View>
          <View>
            <Pressable 
              onPress={() => navigation.navigate('/notifications')}
             
            >
              <Text>notifications</Text>
              <Text></Text>
            </Pressable>
            <Pressable 
              onPress={() => navigation.navigate('/fan/profile')}
             
            >
              <Image source={{ uri: "https://picsum.photos/seed/profile/100" }} />
            </Pressable>
          </View>
        </View>
        <View>
          <View>
            <Text>search</Text>
          </View>
          <TextInput 
            
            placeholder="Creators, films or categories..." 
          />
        </View>
      </View>

      <View>
        <View>
          <View>
            <Text>Watch your vibe</Text>
            <Pressable>See all</Pressable>
          </View>
          <View>
            {vibes.map((vibe) => (
              <View 
                key={vibe.name} 
               
              >
                <Image source={{ uri: vibe.img }} />
                <View></View>
                <View>
                  <Text>{vibe.name}</Text>
                  <Text>{vibe.stats}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View>
            <Text>Live Streamers</Text>
            <View>
              <View></View>
              <Text>Live Now</Text>
            </View>
          </View>
          <View>
            {creators.map((creator) => (
              <View 
                key={creator.name} 
                
                onPress={() => navigation.navigate(`/profile/${creator.name}`)}
              >
                <View>
                  <Image source={{ uri: creator.img }} />
                  {creator.status === 'LIVE' && (
                    <View>
                      <Text>LIVE</Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text>{creator.name}</Text>
                  <Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View>
            <Text>Hot Tickets</Text>
            <Pressable>arrow_forward</Pressable>
          </View>
          <View 
            onPress={() => navigation.navigate('/event/burna-boy')}
           
          >
            <Image source={{ uri: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800" }} />
            <View></View>
            <View>
              <Text>Exclusive View</Text>
            </View>
            <View>
              <View>
                <Text></Text>
                <Text>O2 Arena • London</Text>
              </View>
              <Text>Burna Boy: Love, Damini Tour</Text>
              <View>
                <View>
                  <View>
                    <Text>calendar_month</Text>
                  </View>
                  <View>
                    <Text>Aug 24, 2024</Text>
                    <Text>8:00 PM</Text>
                  </View>
                </View>
                <Pressable>
                  Book Live
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Explore;
