import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


type MessageTab = 'direct' | 'subs' | 'pitches';

const Messaging: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<MessageTab>('direct');
  const [search, setSearch] = useState("");

  const chats = [
    { id: 'Alex_Rivera', name: 'Alex Rivera', msg: "Loved the new track! Can't wait for...", time: 'Just now', unread: true, tier: 'Gold', ltv: '$450', img: 'https://picsum.photos/seed/chat1/100/100', type: 'direct' },
    { id: 'Sarah_Chen', name: 'Sarah Chen', msg: "Will there be a meet and greet in...", time: '12m', unread: false, tier: 'Silver', ltv: '$120', img: 'https://picsum.photos/seed/chat2/100/100', type: 'direct' },
    { id: 'Marcus_Thorne', name: 'Marcus Thorne', msg: "Yo! Great performance at the festival...", time: '1h', unread: false, tier: null, ltv: '$0', img: 'https://picsum.photos/seed/chat3/100/100', type: 'direct' },
    { id: 'Amara', name: 'Amara', msg: "Project Pitch: Winter Solstice Live Collaboration", time: '3h', unread: true, isPitch: true, img: 'https://picsum.photos/seed/amara/100', type: 'pitches' },
    { id: 'Elena_Rodriguez', name: 'Elena Rodriguez', msg: "I just upgraded my tier! Looking forward...", time: '2h', unread: false, tier: 'Gold', ltv: '$210', img: 'https://picsum.photos/seed/chat4/100/100', type: 'direct' },
  ];

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'direct') return matchesSearch && chat.type === 'direct';
    if (activeTab === 'subs') return matchesSearch && chat.tier !== null && chat.type === 'direct';
    if (activeTab === 'pitches') return matchesSearch && chat.type === 'pitches';
    return matchesSearch;
  });

  return (
    <View>
      <View>
        <View>
          <View>
            <View>
              <Image source={{ uri: "https://picsum.photos/seed/mila/100" }} />
            </View>
            <View>
               <Text>Inbox</Text>
               <Text>Creator Protocol</Text>
            </View>
          </View>
          <View>
            <Pressable>
              <Text>edit_note</Text>
            </Pressable>
          </View>
        </View>

        {/* Inbox Intelligence Summary */}
        <View>
          <View>
             <View>
                <View>
                   <Text>psychology</Text>
                </View>
                <View>
                   <Text>Support Density</Text>
                   <Text>4 Pending Subscriber DMs</Text>
                </View>
             </View>
             <View>
                <Text>Active Pitches</Text>
                <Text>2 Unreviewed</Text>
             </View>
          </View>
        </View>

        <View>
          <View>
            <View>
              <Text>search</Text>
            </View>
            <TextInput 
              value={search}
              onChangeText={(value) => setSearch(value)}
              
              placeholder="Search fans or collaborators..." 
            />
          </View>
        </View>

        <View>
          {(['direct', 'subs', 'pitches'] as MessageTab[]).map(t => (
            <Pressable 
              key={t}
              onPress={() => setActiveTab(t)}
             
            >
              {t === 'direct' ? 'Direct' : t === 'subs' ? 'Supporters' : 'Pitches'}
              {activeTab === t && <View></View>}
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        {filteredChats.map((chat, i) => (
          <View 
            key={i} 
            onPress={() => {
              if (chat.type === 'pitches') navigation.navigate('/creator/collaborations', { state: { tab: 'incoming' } });
              else navigation.navigate(`/chat/${chat.id}`);
            }}
           
          >
            <View>
              <View>
                <Image source={{ uri: chat.img }} />
              </View>
              {chat.tier && (
                <View>
                  <Text>stars</Text>
                </View>
              )}
              {chat.unread && <View></View>}
            </View>

            <View>
              <View>
                <View>
                  <Text>{chat.name}</Text>
                  {chat.type === 'pitches' && (
                    <Text>Collab Pitch</Text>
                  )}
                </View>
                <Text>
                  {chat.time}
                </Text>
              </View>
              <Text>
                {chat.msg}
              </Text>
              {chat.tier && (
                <View>
                   <Text>{chat.tier} Membership</Text>
                   <View></View>
                   <Text>LTV: {chat.ltv}</Text>
                </View>
              )}
            </View>
            
            <View>
               <Text>chevron_right</Text>
            </View>
          </View>
        ))}
        
        {filteredChats.length === 0 && (
          <View>
            <Text>chat_bubble_outline</Text>
            <Text>No transmissions in this orbit</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Messaging;
