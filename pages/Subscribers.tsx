import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

type TabType = 'subs' | 'followers' | 'following';
type FanStatus = 'active' | 'superfan' | 'at-risk' | 'new';

interface User {
  id: string;
  name: string;
  handle: string;
  img: string;
  tier?: 'Gold' | 'Silver' | 'Bronze';
  score?: number;
  isCreator?: boolean;
  status?: string;
  fanStatus?: FanStatus;
  joinedDate?: string;
  ltv?: string;
}

const SUBSCRIBERS: User[] = [
  { id: 's1', name: 'Marcus Thorne', handle: '@mthorne', tier: 'Gold', score: 98, img: 'https://picsum.photos/seed/f1/100', fanStatus: 'superfan', joinedDate: 'Jan 2024', ltv: '$450.00' },
  { id: 's2', name: 'Sarah Chen', handle: '@schen_music', tier: 'Silver', score: 85, img: 'https://picsum.photos/seed/f2/100', fanStatus: 'active', joinedDate: 'Mar 2024', ltv: '$120.00' },
  { id: 's3', name: 'Alex Rivera', handle: '@alex_vibes', tier: 'Silver', score: 42, img: 'https://picsum.photos/seed/f3/100', fanStatus: 'at-risk', joinedDate: 'Feb 2024', ltv: '$90.00' },
  { id: 's4', name: 'Dante King', handle: '@dante_k', tier: 'Bronze', score: 75, img: 'https://picsum.photos/seed/f5/100', fanStatus: 'new', joinedDate: 'Aug 2024', ltv: '$4.99' },
];

const FOLLOWERS: User[] = [
  { id: 'f1', name: 'Lila Grace', handle: '@lilagrace', score: 45, img: 'https://picsum.photos/seed/f4/100' },
  { id: 'f2', name: 'Echo Hunter', handle: '@echohunter', score: 38, img: 'https://picsum.photos/seed/f6/100' },
];

const FOLLOWING: User[] = [
  { id: 'c1', name: 'Elena Rose', handle: '@elenarose', isCreator: true, status: 'LIVE', img: 'https://picsum.photos/seed/elena/100' },
];

const Subscribers: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabType>('subs');
  const [search, setSearch] = useState("");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedFan, setSelectedFan] = useState<User | null>(null);

  const runNetworkAudit = async () => {
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this network for a creator: 842 Paid Subscribers, 14.2k Followers. 1 fan named Alex Rivera is 'At Risk' with a 42% engagement score. Give a 1-sentence strategic action.`,
      });
      setAiInsight(response.text || "Engagement for 'At Risk' fans is sliding. Send a personalized DM to Alex Rivera to retain them.");
    } catch (e) {
      setAiInsight("At-risk subscribers are peaking. Consider a group DM discount for the 'Silver Tier' to re-engage lapsed fans.");
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredList = (activeTab === 'subs' ? SUBSCRIBERS : activeTab === 'followers' ? FOLLOWERS : FOLLOWING).filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View>
      <View>
        <View>
          <View>
            <Pressable onPress={() => navigation.navigate('/dashboard')}>
              <Text>arrow_back</Text>
            </Pressable>
            <Text>Fan CRM</Text>
          </View>
        </View>

        <View>
          <Text>search</Text>
          <TextInput 
            value={search}
            onChangeText={(value) => setSearch(value)}
           
            // Fixed undefined variable 'tab' by using 'activeTab'
            placeholder={`Search ${activeTab === 'subs' ? 'subscribers' : activeTab === 'followers' ? 'followers' : 'following'}...`}
          />
        </View>

        <View>
          {(['subs', 'followers', 'following'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
             
            >
              {tab === 'subs' ? 'Subscribers' : tab === 'followers' ? 'Followers' : 'Following'}
              {activeTab === tab && <View></View>}
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        {/* AI Insight Box */}
        <View>
           <View>
             <View>
               <Text>auto_awesome</Text>
               <Text>Retention AI</Text>
             </View>
           </View>
           <Text>
             {aiInsight || "Unlock fan lifecycle insights. Gemini is ready to audit your relationship health."}
           </Text>
           <Pressable onPress={runNetworkAudit} disabled={isAuditing}>
             {isAuditing ? "Auditing..." : "Identify At-Risk Fans"}
           </Pressable>
        </View>

        <View>
          {filteredList.map((user) => (
            <View 
              key={user.id} 
              onPress={() => setSelectedFan(user)}
             
            >
              <View>
                <View>
                  <View>
                    <Image source={{ uri: user.img }} />
                  </View>
                  {user.fanStatus === 'at-risk' && <View></View>}
                  {user.fanStatus === 'superfan' && <View><Text>star</Text></View>}
                </View>
                <View>
                   <Text>{user.name}</Text>
                   <View>
                     <Text>{user.handle}</Text>
                     {user.fanStatus && (
                       <Text>{user.fanStatus}</Text>
                     )}
                   </View>
                </View>
              </View>
              <View>
                <Text>{user.score}%</Text>
                <Text>Score</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Fan CRM Modal */}
      {selectedFan && (
        <View>
          <View onPress={() => setSelectedFan(null)}></View>
          <View>
            <View></View>
            
            <View>
               <View>
                  <Image source={{ uri: selectedFan.img }} />
               </View>
               <View>
                  <Text>{selectedFan.name}</Text>
                  <Text>{selectedFan.handle}</Text>
               </View>
            </View>

            <View>
               <View>
                  <Text>Lifetime Value</Text>
                  <Text>{selectedFan.ltv || '$0.00'}</Text>
               </View>
               <View>
                  <Text>Supporter Since</Text>
                  <Text>{selectedFan.joinedDate || 'New'}</Text>
               </View>
            </View>

            <View>
               <Text>Relationship Notes</Text>
               <TextInput 
               
                placeholder="Add private creator notes about this fan..."
               />
            </View>

            <View>
               <Text>Interaction History</Text>
               <View>
                  <View>
                     <Text>stars</Text>
                     <Text>Upgraded to {selectedFan.tier || 'Silver'} Tier • 2w ago</Text>
                  </View>
                  <View>
                     <Text>chat</Text>
                     <Text>Tipped $50.00 during "Nebula Live" • 3w ago</Text>
                  </View>
               </View>
            </View>

            <View>
               <Pressable 
                onPress={() => navigation.navigate(`/chat/${selectedFan.name}`)}
               
               >
                 Send Priority Message
                 <Text>send</Text>
               </Pressable>
               <Pressable>
                 <Text>more_horiz</Text>
               </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Subscribers;
