import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


interface FanProfileProps {
  onLogout?: () => void;
}

const FanProfile: React.FC<FanProfileProps> = ({ onLogout }) => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Favorites');

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
    <View>
      {/* Dynamic Cover Header */}
      <View>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800" }} 
          
          
        />
        <View></View>
        
        <View>
          <Pressable 
            onPress={() => navigation.navigate('/feed')} 
           
          >
            <Text>close</Text>
          </Pressable>
          <Pressable 
            onPress={() => navigation.navigate('/fan/settings')}
           
          >
            <Text>settings</Text>
          </Pressable>
        </View>

        <View>
          <View>
            <View>
              <Image source={{ uri: "https://picsum.photos/seed/profile/300" }} />
            </View>
            <View>
              <Text>stars</Text>
            </View>
          </View>
          <View>
             <Text>Alex Rivera</Text>
             <Text>Member #0042</Text>
          </View>
        </View>
      </View>

      <View>
        {/* Vibe Signature */}
        <View>
          {vibes.map(v => (
            <Text key={v}>{v}</Text>
          ))}
          <Pressable onPress={() => navigation.navigate('/vibe-picker')}>
            <Text>edit</Text>
          </Pressable>
        </View>

        {/* Quick Vitals */}
        <View>
          {stats.map((stat) => (
            <Pressable 
              key={stat.label} 
              onPress={() => navigation.navigate(stat.path)}
             
            >
              <Text>{stat.value}</Text>
              <Text>{stat.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Primary Fan Actions */}
        <View>
           <Pressable 
             onPress={() => navigation.navigate('/fan/settings', { state: { view: 'identity' } })}
            
           >
             <View>
               <Text>id_card</Text>
             </View>
             <View>
               <Text>qr_code_scanner</Text>
             </View>
             <View>
               <Text>Identity{'\\n'}Pass</Text>
               <Text>2 Tickets Active</Text>
             </View>
           </Pressable>

           <Pressable 
             onPress={() => navigation.navigate('/fan/premium')}
            
           >
             <View>
               <Text>lock_open</Text>
             </View>
             <View>
               <Text>stars</Text>
             </View>
             <View>
               <Text>Subscriber{'\\n'}Premium</Text>
               <Text>12 Items Unlocked</Text>
             </View>
           </Pressable>
        </View>

        {/* Activity Tabs */}
        <View>
          <View>
            {['Favorites', 'Collections', 'Recent'].map((tab) => (
              <Pressable 
                key={tab}
                onPress={() => setActiveTab(tab)}
               
              >
                {tab}
                {activeTab === tab && <View></View>}
              </Pressable>
            ))}
          </View>

          <View>
             {activeTab === 'Favorites' && favorites.map((artist, i) => (
               <View 
                 key={i} 
                 onPress={() => navigation.navigate(`/profile/${artist.name}`)}
                
               >
                 <View>
                    <View>
                       <Image source={{ uri: artist.img }} />
                    </View>
                    <View>
                       <Text>{artist.name}</Text>
                       <Text>{artist.handle}</Text>
                    </View>
                 </View>
                 <View>
                    <Text>stars</Text>
                    <Text>chevron_right</Text>
                 </View>
               </View>
             ))}
             
             {activeTab === 'Collections' && (
               <View>
                  {[1, 2].map(i => (
                    <View key={i} onPress={() => navigation.navigate('/premium')}>
                       <View>
                          <Image source={{ uri: `https://picsum.photos/seed/coll${i }}/400/225`} />
                          <View></View>
                          <View><Text>Premium</Text></View>
                       </View>
                       <Text>Exclusive Asset #{i+102}</Text>
                    </View>
                  ))}
               </View>
             )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default FanProfile;
