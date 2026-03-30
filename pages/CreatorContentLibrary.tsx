import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

type ContentType = 'all' | 'public' | 'premium' | 'live' | 'draft';
type TierType = 'bronze' | 'silver' | 'gold';

interface LibraryItem {
  id: string;
  title: string;
  type: ContentType;
  tier?: TierType;
  stats: {
    primary: string; // views
    revenue: string;
    engagement: number;
    retention: string;
  };
  img: string;
  date: string;
  url?: string;
  description?: string;
}

const INITIAL_DATA: LibraryItem[] = [
  { id: '1', title: 'Summer Tour Highlights', type: 'public', stats: { primary: '1.2M views', revenue: '$14,200', engagement: 92, retention: '68%' }, img: 'https://picsum.photos/seed/vid1/150', date: 'Aug 24, 2024', description: 'Raw energy from the London leg of the world tour. This public drop drove significant subscriber conversion.' },
  { id: '2', title: 'Behind the Scenes: Ep 1', type: 'premium', tier: 'silver', stats: { primary: '450k views', revenue: '$4,100', engagement: 78, retention: '84%' }, img: 'https://picsum.photos/seed/vid2/150', date: 'Aug 22, 2024', url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-singing-into-a-microphone-in-a-studio-4244-large.mp4', description: 'Exclusive look into the vocal production of Nebula. Silver tier and above only.' },
  { id: '3', title: 'Studio Transmission #4', type: 'live', stats: { primary: 'Live Recap', revenue: '$8,400', engagement: 95, retention: '92%' }, img: 'https://picsum.photos/seed/vid3/150', date: 'Aug 20, 2024', description: 'Replay of the improvised synth session that broke viewer records.' },
  { id: '4', title: 'Secret Project 24', type: 'draft', stats: { primary: 'In Review', revenue: '$0', engagement: 0, retention: '0%' }, img: 'https://picsum.photos/seed/vid4/150', date: 'Just now', description: 'Upcoming experimental visual album component. Pending final color grade.' },
  { id: '5', title: 'Midnight Chill Vlog', type: 'public', stats: { primary: '12k views', revenue: '$120', engagement: 65, retention: '45%' }, img: 'https://picsum.photos/seed/vid5/150', date: 'Aug 18, 2024' },
  { id: '6', title: 'Acoustic Sessions (Uncut)', type: 'premium', tier: 'gold', stats: { primary: '89k views', revenue: '$1,200', engagement: 88, retention: '91%' }, img: 'https://picsum.photos/seed/vid6/150', date: 'Aug 15, 2024' },
];

const CreatorContentLibrary: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [items, setItems] = useState<LibraryItem[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<ContentType>('all');
  const [search, setSearch] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Interaction State
  const [previewingVideo, setPreviewingVideo] = useState<LibraryItem | null>(null);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<LibraryItem | null>(null);
  const [tierSelectorItem, setTierSelectorItem] = useState<LibraryItem | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isItemAiLoading, setIsItemAiLoading] = useState(false);
  const [itemAiInsight, setItemAiInsight] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-container')) {
        setOpenMenuId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const runContentAudit = async () => {
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "You are a content strategist. Give a 1-sentence strategic recommendation for a creator library with high premium engagement.",
      });
      setAiInsight(response.text || "Your Premium engagement is peaking. Convert more public highlights to subscriber-only to drive growth.");
    } catch (e) {
      setAiInsight("Public reach is strong, but Premium conversion is low. Consider offering a 'First Look' draft to your Top Supporters.");
    } finally {
      setIsAuditing(false);
    }
  };

  const fetchItemAiStrategy = async (item: LibraryItem) => {
    setIsItemAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this content: "${item.title}". It has ${item.stats.primary} and ${item.stats.retention} retention. Give 1 sentence of advice for the next part of this series.`,
      });
      setItemAiInsight(response.text || "Strong retention on the mid-section. Focus more on long-form rehearsal footage in Part 2.");
    } catch (e) {
      setItemAiInsight("Retention is above average. The current format resonates with your core subscribers.");
    } finally {
      setIsItemAiLoading(false);
    }
  };

  const handleConvertToPremium = (tier: TierType) => {
    const targetItem = tierSelectorItem || selectedDetailsItem;
    if (!targetItem) return;
    
    setIsConverting(true);
    setTimeout(() => {
      setItems(prev => prev.map(item => 
        item.id === targetItem.id 
          ? { ...item, type: 'premium', tier: tier } 
          : item
      ));
      if (selectedDetailsItem && selectedDetailsItem.id === targetItem.id) {
        setSelectedDetailsItem({ ...selectedDetailsItem, type: 'premium', tier: tier });
      }
      setIsConverting(false);
      setTierSelectorItem(null);
    }, 1200);
  };

  const handleProtocolSync = (newProtocol: ContentType, targetItemId?: string) => {
    const id = targetItemId || selectedDetailsItem?.id;
    if (!id) return;
    
    setIsConverting(true);
    setTimeout(() => {
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, type: newProtocol, tier: newProtocol === 'public' ? undefined : item.tier } 
          : item
      ));
      if (selectedDetailsItem && selectedDetailsItem.id === id) {
        setSelectedDetailsItem({ 
          ...selectedDetailsItem, 
          type: newProtocol, 
          tier: newProtocol === 'public' ? undefined : selectedDetailsItem.tier 
        });
      }
      setIsConverting(false);
    }, 1200);
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    const isDraft = item?.type === 'draft';
    const message = isDraft 
      ? "Discard this draft permanently?" 
      : "Permanently delete this transmission? This cannot be undone.";
      
    if (window.confirm(message)) {
      setItems(prev => prev.filter(item => item.id !== id));
      setOpenMenuId(null);
      setSelectedDetailsItem(null);
    }
  };

  const handleEditItem = (item: LibraryItem) => {
    navigation.navigate('/upload', { state: { editing: item.id, item } });
  };

  const closeTheatre = () => {
    setPreviewingVideo(null);
  };

  const tabs: { id: ContentType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'public', label: 'Public' },
    { id: 'premium', label: 'Premium' },
    { id: 'live', label: 'Live' },
    { id: 'draft', label: 'Drafts' },
  ];

  const renderActionMenu = (item: LibraryItem) => {
    const isDraft = item.type === 'draft';
    const isPublic = item.type === 'public';
    const isPremium = item.type === 'premium';
    
    const menuItemClass = "w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left group/item";
    const deleteItemClass = "w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left group/item text-red-500/80 hover:text-red-500";
    const iconClass = "text-xl transition-transform group-hover/item:scale-110";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-inherit";

    return (
      <View 
       
        onPress={(e) => e.stopPropagation()}
      >
        <Pressable onPress={(e) => { e.stopPropagation(); setSelectedDetailsItem(item); setOpenMenuId(null); }}>
          <Text>info</Text>
          <Text>View Analytics</Text>
        </Pressable>

        {isPublic && (
          <Pressable onPress={(e) => { e.stopPropagation(); setTierSelectorItem(item); setOpenMenuId(null); }}>
            <Text>stars</Text>
            <Text>Move to Premium</Text>
          </Pressable>
        )}

        {isPremium && (
          <Pressable onPress={(e) => { e.stopPropagation(); handleProtocolSync('public', item.id); setOpenMenuId(null); }}>
            <Text>public</Text>
            <Text>Move to Public</Text>
          </Pressable>
        )}

        <Pressable onPress={(e) => { e.stopPropagation(); handleEditItem(item); setOpenMenuId(null); }}>
          <Text>edit</Text>
          <Text>Edit Details</Text>
        </Pressable>
        
        <View></View>
        
        <Pressable onPress={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}>
          <Text>delete</Text>
          <Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View>
      <View>
        <View>
          <View>
            <Pressable onPress={() => navigation.navigate('/dashboard')}>arrow_back</Pressable>
            <Text>Media Library</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('/upload')}>
            <Text>add</Text>
          </Pressable>
        </View>
        <View>
          <Text>search</Text>
          <TextInput 
            value={search} 
            onChangeText={(value) => setSearch(value)} 
            
            placeholder="Search your productions..." 
          />
        </View>
        <View>
          {tabs.map((tab) => (
            <Pressable 
              key={tab.id} 
              onPress={() => setActiveTab(tab.id)} 
             
            >
              {tab.label}
              {activeTab === tab.id && <View></View>}
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <View>
           <View>
             <Text>auto_awesome</Text>
             <Text>Cinematic Strategy</Text>
           </View>
           <Text>{aiInsight || "Gemini is ready to audit your visual library for engagement potential."}</Text>
           <Pressable onPress={runContentAudit} disabled={isAuditing}>
             {isAuditing ? "Auditing Archives..." : "Audit Content Value"}
           </Pressable>
        </View>

        <View>
          {items.filter(i => {
            const matchesTab = activeTab === 'all' || i.type === activeTab;
            const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
            return matchesTab && matchesSearch;
          }).map((item) => (
            <View 
              key={item.id} 
              onPress={() => setSelectedDetailsItem(item)}
              style={{ zIndex: openMenuId === item.id ? 60 : 10 }}
             
            >
              <View>
                <View 
                 
                >
                  <Image source={{ uri: item.img }} />
                  {(item.type === 'premium' || item.tier) && (
                    <View>
                      <Text>stars</Text>
                    </View>
                  )}
                </View>
                
                <View>
                  <Text>{item.title}</Text>
                  <View>
                    <Text>
                      {item.type}{item.tier ? ` • ${item.tier}` : ''}
                    </Text>
                    <Text>{item.date}</Text>
                  </View>
                  {item.type !== 'draft' ? (
                    <View>
                      <Text>
                        <Text>visibility</Text>
                        {item.stats.primary.split(' ')[0]}
                      </Text>
                      <Text>
                        <Text>payments</Text>
                        {item.stats.revenue}
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Text>Draft Protocol: Sync Pending</Text>
                    </View>
                  )}
                </View>

                <View>
                  <Pressable 
                    onPress={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }} 
                   
                  >
                    <Text>more_vert</Text>
                  </Pressable>
                  {openMenuId === item.id && renderActionMenu(item)}
                </View>
              </View>
            </View>
          ))}
          
          {items.filter(i => (activeTab === 'all' || i.type === activeTab) && i.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <View>
              <View>
                <Text>inventory_2</Text>
              </View>
              <Text>No media found in this orbit</Text>
              <Pressable onPress={() => setActiveTab('all')}>Reset Filters</Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Content Details Drawer */}
      {selectedDetailsItem && (
        <View>
          <View onPress={() => setSelectedDetailsItem(null)}></View>
          <View>
            <View></View>
            
            <View>
              <View>
                <Text>Content Metrics</Text>
                <Pressable onPress={() => setSelectedDetailsItem(null)}><Text>close</Text></Pressable>
              </View>
              
              <View>
                 <Image source={{ uri: selectedDetailsItem.img }} />
                 <View>
                    <Pressable 
                      onPress={() => { setPreviewingVideo(selectedDetailsItem); }}
                     
                    >
                      <Text>play_arrow</Text>
                    </Pressable>
                 </View>
                 <View>
                    <Text>{selectedDetailsItem.title}</Text>
                    <Text>{selectedDetailsItem.date}</Text>
                 </View>
              </View>
            </View>

            {/* Performance Grids */}
            <View>
               <View>
                  <Text>Lifetime Revenue</Text>
                  <Text>{selectedDetailsItem.stats.revenue}</Text>
               </View>
               <View>
                  <Text>Retention Score</Text>
                  <Text>{selectedDetailsItem.stats.retention}</Text>
               </View>
            </View>

            {/* AI Advisor for this Item */}
            <View>
              <View></View>
              <View>
                <View>
                   <View>
                      <Text>auto_awesome</Text>
                      <Text>Gemini Content Audit</Text>
                   </View>
                   {isItemAiLoading && <View></View>}
                </View>
                <Text>
                  {itemAiInsight || "Analyze frame-by-frame audience patterns to optimize your next production cycle."}
                </Text>
                {!itemAiInsight && (
                  <Pressable 
                    onPress={() => fetchItemAiStrategy(selectedDetailsItem)}
                    disabled={isItemAiLoading}
                   
                  >
                    Run Production Audit
                  </Pressable>
                )}
              </View>
            </View>

            {/* Protocol Control */}
            <View>
               <Text>Distribution Protocol</Text>
               <View>
                  <Pressable 
                    onPress={() => handleProtocolSync('public')}
                   
                  >
                    Public Feed
                  </Pressable>
                  <Pressable 
                    onPress={() => { setTierSelectorItem(selectedDetailsItem); }}
                   
                  >
                    Premium Locked
                  </Pressable>
               </View>
               {selectedDetailsItem.description && (
                 <Text>"{selectedDetailsItem.description}"</Text>
               )}
            </View>

            {/* Quick Master Actions */}
            <View>
               <Pressable 
                onPress={() => handleEditItem(selectedDetailsItem)}
               
               >
                 Edit
               </Pressable>
               <Pressable 
                onPress={() => handleDeleteItem(selectedDetailsItem.id)}
               
               >
                 {selectedDetailsItem.type === 'draft' ? 'Discard' : 'Delete'}
               </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Tier Selection Drawer (Nested from Details) */}
      {tierSelectorItem && (
        <View>
          <View onPress={() => !isConverting && setTierSelectorItem(null)}></View>
          <View>
            <View></View>
            
            <View>
              <View>
                <Image source={{ uri: tierSelectorItem.img }} />
              </View>
              <View>
                <Text>Restrict Content</Text>
                <Text>Transition to Premium Protocol</Text>
              </View>
            </View>

            {isConverting ? (
               <View>
                  <View></View>
                  <Text>Syncing Galaxy Tier Metadata...</Text>
               </View>
            ) : (
              <View>
                <Text>Select Minimum Tier Access</Text>
                <View>
                  {[
                    { id: 'bronze' as TierType, label: 'Bronze', price: '$4.99', color: 'border-orange-600/40 text-orange-600 dark:text-orange-400 bg-orange-600/5' },
                    { id: 'silver' as TierType, label: 'Silver', price: '$14.99', color: 'border-slate-400/40 text-slate-600 dark:text-gray-300 bg-gray-400/5' },
                    { id: 'gold' as TierType, label: 'Gold', price: '$49.99', color: 'border-yellow-500/40 text-yellow-600 dark:text-yellow-500 bg-yellow-500/5' },
                  ].map((tier) => (
                    <Pressable 
                      key={tier.id}
                      onPress={() => handleConvertToPremium(tier.id)}
                     
                    >
                      <View>
                        <View>
                          <Text>verified</Text>
                        </View>
                        <View>
                          <Text>{tier.label} Tier</Text>
                          <Text>Entry price: {tier.price}</Text>
                        </View>
                      </View>
                      <Text>chevron_right</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Video Preview Theatre */}
      {previewingVideo && (
        <View>
           <View onPress={closeTheatre}></View>
           <View>
              <video 
                ref={videoRef}
                src={previewingVideo.url || "https://assets.mixkit.co/videos/preview/mixkit-girl-singing-into-a-microphone-in-a-studio-4244-large.mp4"}
               
                autoPlay
                controls
                playsInline
              />
              <Pressable onPress={closeTheatre}><Text>close</Text></Pressable>
              <View>
                  <Text>{previewingVideo.title}</Text>
                  <Text>Protocol: {previewingVideo.type}</Text>
              </View>
           </View>
        </View>
      )}
    </View>
  );
};

export default CreatorContentLibrary;
