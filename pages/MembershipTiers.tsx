import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

interface Tier {
  id: string;
  name: string;
  price: string;
  color: string;
  perks: string[];
  currentMembers: number;
}

const INITIAL_TIERS: Tier[] = [
  { id: 'bronze', name: 'Bronze', price: '4.99', color: 'border-orange-600/40 bg-orange-600/5', perks: ['Exclusive feed access', 'Public recognition'], currentMembers: 1876 },
  { id: 'silver', name: 'Silver', price: '14.99', color: 'border-gray-400/40 bg-gray-400/5', perks: ['Backstage digital vault', 'Monthly BTS video', 'Voting rights'], currentMembers: 824 },
  { id: 'gold', name: 'Gold', price: '49.99', color: 'border-yellow-500/40 bg-yellow-500/5', perks: ['1:1 monthly chat', 'VIP Merch discounts', 'All Vault Access'], currentMembers: 142 },
];

const MembershipTiers: React.FC = () => {
  const navigation = useNavigation<any>();
  const [tiers, setTiers] = useState<Tier[]>(INITIAL_TIERS);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [newPerkText, setNewPerkText] = useState("");

  const totalMonthlyRevenue = useMemo(() => {
    return tiers.reduce((acc, t) => acc + (parseFloat(t.price) * t.currentMembers), 0);
  }, [tiers]);

  const handlePriceChange = (id: string, newPrice: string) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, price: newPrice } : t));
  };

  const getAiPricingAdvice = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "You are a creator economy expert. An artist has 3 tiers: $4.99, $14.99, $49.99. Suggest a 1-sentence perk addition for the Gold tier to justify the premium price.",
      });
      alert(response.text || "Add personalized video shout-outs to the Gold tier.");
    } catch (e) {
      alert("AI Suggestion: Include early access to all future concert ticket pre-sales.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const openEditor = (tier: Tier) => {
    setEditingTier({ ...tier, perks: [...tier.perks] });
    setIsEditorOpen(true);
  };

  const saveTier = () => {
    if (!editingTier) return;
    setTiers(prev => {
      const exists = prev.find(t => t.id === editingTier.id);
      if (exists) {
        return prev.map(t => t.id === editingTier.id ? editingTier : t);
      }
      return [...prev, { ...editingTier, currentMembers: 0 }];
    });
    setIsEditorOpen(false);
    setEditingTier(null);
  };

  const handleGlobalSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }, 1500);
  };

  return (
    <View>
      <View>
        <View>
          <Pressable onPress={() => navigation.goBack()}>
            <Text>arrow_back</Text>
          </Pressable>
          <Text>Galaxy Economy</Text>
        </View>
        <Pressable 
          onPress={getAiPricingAdvice}
          disabled={isAiLoading}
         
        >
          <Text>auto_awesome</Text>
        </Pressable>
      </View>

      <View>
        {/* Revenue Projection Card */}
        <View>
          <View></View>
          <View>
             <View>
                <View>
                   <Text>Projected MRR</Text>
                   <Text>${totalMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                </View>
                <View>
                   <Text>trending_up</Text>
                </View>
             </View>
             <View>
                <View style={{ width: '65%' }}></View>
             </View>
             <Text>Based on {tiers.reduce((a,b)=>a+b.currentMembers, 0)} active members</Text>
          </View>
        </View>

        <View>
          <View>
             <Text>Tier Management</Text>
             <Pressable onPress={() => openEditor({ id: `t-${Date.now()}`, name: 'New Tier', price: '9.99', perks: [], color: 'border-blue-500/40 bg-blue-500/5', currentMembers: 0 })}>+ Add New</Pressable>
          </View>
          {tiers.map((tier) => (
            <View key={tier.id}>
              <View>
                <View>
                  <Text>{tier.name}</Text>
                  <Text>Tier Strategy</Text>
                </View>
                <View>
                   <Text>$</Text>
                   <TextInput 
                    type="number"
                    value={tier.price}
                    onChangeText={(value) => handlePriceChange(tier.id, value)}
                   
                   />
                </View>
              </View>

              <View>
                 <Text>Active Perks</Text>
                 <View>
                    {tier.perks.map((perk, i) => (
                      <View key={i}>• {perk}</View>
                    ))}
                    <Pressable onPress={() => openEditor(tier)}>
                      <Text>edit</Text>
                    </Pressable>
                 </View>
              </View>

              <View>
                 <View>
                    <View>
                       <Text>{tier.currentMembers}</Text>
                       <Text>Members</Text>
                    </View>
                    <View></View>
                    <View>
                       <Text>${(parseFloat(tier.price) * tier.currentMembers).toLocaleString()}</Text>
                       <Text>LTV Monthly</Text>
                    </View>
                 </View>
                 <Pressable 
                  onPress={() => openEditor(tier)}
                 
                 >
                   <Text>settings_suggest</Text>
                 </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Editor Drawer */}
      {isEditorOpen && editingTier && (
        <View>
          <View onPress={() => setIsEditorOpen(false)}></View>
          <View>
            <View></View>
            
            <View>
              <Text>{tiers.find(t => t.id === editingTier.id) ? 'Refine Tier' : 'New Tier Prototype'}</Text>
              <Pressable onPress={() => setIsEditorOpen(false)}><Text>close</Text></Pressable>
            </View>

            <View>
              <View>
                <Text>Identity Label</Text>
                <TextInput 
                  value={editingTier.name}
                  onChangeText={(value) => setEditingTier({...editingTier, name: value})}
                 
                />
              </View>

              <View>
                <Text>Pricing Strategy (USD)</Text>
                <View>
                  <Text>$</Text>
                  <TextInput 
                    type="number"
                    value={editingTier.price}
                    onChangeText={(value) => setEditingTier({...editingTier, price: value})}
                   
                  />
                </View>
              </View>

              <View>
                <Text>Perk Pipeline</Text>
                <View>
                   {editingTier.perks.map((perk, idx) => (
                     <View key={idx}>
                        <Text>{perk}</Text>
                        <Pressable onPress={() => setEditingTier({...editingTier, perks: editingTier.perks.filter((_,i)=>i!==idx)})}>
                          <Text>delete</Text>
                        </Pressable>
                     </View>
                   ))}
                </View>

                <View>
                  <TextInput 
                    value={newPerkText}
                    onChangeText={(value) => setNewPerkText(value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPerkText.trim() && editingTier) {
                        setEditingTier({...editingTier, perks: [...editingTier.perks, newPerkText.trim()]});
                        setNewPerkText("");
                      }
                    }}
                   
                    placeholder="New value-add..."
                  />
                  <Pressable 
                    onPress={() => { if(newPerkText.trim() && editingTier){ setEditingTier({...editingTier, perks: [...editingTier.perks, newPerkText.trim()]}); setNewPerkText(""); } }}
                   
                  >
                    <Text>add</Text>
                  </Pressable>
                </View>
              </View>

              <View>
                <Pressable 
                  onPress={saveTier}
                 
                >
                  Synchronize Tier
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}

      <View>
        <Pressable 
          onPress={handleGlobalSave}
          disabled={isSaving}
         
        >
          {isSaving ? <View></View> : 'Publish Economy'}
          {!isSaving && <Text>rocket_launch</Text>}
        </Pressable>
      </View>
    </View>
  );
};

export default MembershipTiers;
