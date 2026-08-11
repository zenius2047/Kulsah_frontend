import React from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const ElephantLogo = ({ className = "size-6" }: { className?: string }) => (
  <Text>K</Text>
);

interface ExploreProps {
  onLogout?: () => void;
}

const Explore: React.FC<ExploreProps> = ({ onLogout }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();

  const vibes = [
    { name: 'Afro-Cinema', stats: '1.2M Viewing', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400' },
    { name: 'Live Concerts', stats: '850K Viewing', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400' },
    { name: 'Vlogs', stats: '3.5M Viewing', img: 'https://images.unsplash.com/photo-1546707012-c51841275c6f?auto=format&fit=crop&q=80&w=400' },
    { name: 'Neon Art', stats: '420K Viewing', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400' },
  ];

  const creators = [
    { name: 'Amara', handle: 'amara', status: 'LIVE', img: 'https://picsum.photos/seed/p1/150/150' },
    { name: 'Zion King', handle: 'zionking', status: '140k subs', img: 'https://picsum.photos/seed/p2/150/150' },
    { name: 'Lila Moon', handle: 'lilamoon', status: 'LIVE', img: 'https://picsum.photos/seed/p3/150/150' },
    { name: 'DJ Kay-T', handle: 'djkayt', status: '92k subs', img: 'https://picsum.photos/seed/p4/150/150' },
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
          <TextInput includeFontPadding={false} 
            
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
              <Pressable
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
                  <Text>@{creator.handle}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <View>
            <Text>Hot Tickets</Text>
            <Pressable>arrow_forward</Pressable>
          </View>
          <Pressable
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
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Explore;
