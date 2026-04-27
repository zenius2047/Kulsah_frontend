import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

interface StoreItem {
  id: string;
  name: string;
  price: string;
  stock: string;
  isUnlimited: boolean;
  sales: string;
  status: 'active' | 'sold-out' | 'hidden';
  img: string;
  description?: string;
}

const INITIAL_ITEMS: StoreItem[] = [
  { id: '1', name: 'Ethereal Vinyl (Limited)', price: '45.00', stock: '12', isUnlimited: false, sales: '88', status: 'active', img: 'https://picsum.photos/seed/merch1/200', description: 'Limited edition high-fidelity vinyl pressing.' },
  { id: '2', name: 'Nebula Stems Pack', price: '25.00', stock: 'Unlimited', isUnlimited: true, sales: '245', status: 'active', img: 'https://picsum.photos/seed/merch2/200', description: 'Full production stems for the hit single Nebula.' },
  { id: '3', name: 'Official Tour Tee', price: '35.00', stock: '0', isUnlimited: false, sales: '500', status: 'sold-out', img: 'https://picsum.photos/seed/merch3/200', description: '100% organic cotton tour merchandise.' },
];

const CreatorStore: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<StoreItem[]>(INITIAL_ITEMS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<any>(null);

  const openEditor = (item: StoreItem | null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({
        id: `prod-${Date.now()}`,
        name: '',
        price: '0.00',
        stock: '100',
        isUnlimited: false,
        sales: '0',
        status: 'active',
        img: 'https://picsum.photos/seed/newprod/200',
        description: ''
      });
    }
    setIsEditorOpen(true);
  };

  const saveItem = () => {
    if (!editingItem) return;
    setItems(prev => {
      const exists = prev.find(i => i.id === editingItem.id);
      if (exists) {
        return prev.map(i => i.id === editingItem.id ? editingItem : i);
      }
      return [...prev, editingItem];
    });
    setIsEditorOpen(false);
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    if (confirm("Permanently remove this product from your boutique?")) {
      setItems(prev => prev.filter(i => i.id !== id));
      setIsEditorOpen(false);
      setEditingItem(null);
    }
  };

  const handleGlobalSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }, 1500);
  };

  const generateAiDescription = async () => {
    if (!editingItem?.name) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a high-end luxury merch copywriter. Write a 1-sentence magnetic product description for a creator item named "${editingItem.name}". Focus on exclusivity and the "galaxy" vibe.`,
      });
      setEditingItem(prev => prev ? { ...prev, description: response.text || "" } : null);
    } catch (e) {
      setEditingItem(prev => prev ? { ...prev, description: "A limited celestial artifact for true cosmic collectors." } : null);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingItem) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem({ ...editingItem, img: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <View>
      <View>
        <View>
          <Pressable onPress={() => navigation.goBack()}>
            <Text>chevron_left</Text>
          </Pressable>
          <Text>Online Store</Text>
        </View>
        <Pressable 
          onPress={() => openEditor(null)}
         
        >
          <Text>add</Text>
        </Pressable>
      </View>

      {showSaveSuccess && (
        <View>
          Catalog Updated
        </View>
      )}

      <View>
        <View>
           <View>
             <Text>Total Sales</Text>
             <Text>833</Text>
             <Text>+12 Today</Text>
           </View>
           <View>
             <Text>Gross Rev</Text>
             <Text>$28.4K</Text>
             <Text>Pending payout</Text>
           </View>
        </View>

        <View>
          <View>
            <Text>Product Catalog</Text>
            <Pressable>Global Sync</Pressable>
          </View>
          
          <View>
            {items.map((item) => (
              <View 
                key={item.id} 
                onPress={() => openEditor(item)}
               
              >
                <View>
                  <Image source={{ uri: item.img }} />
                  <View>
                    <Text>{item.name}</Text>
                    <View>
                       <Text>${item.price}</Text>
                       <Text>
                         {item.isUnlimited ? 'Unlimited' : `${item.stock} left`}
                       </Text>
                    </View>
                  </View>
                </View>
                <View>
                   <Text>
                     {item.status}
                   </Text>
                   <Pressable>settings</Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View>
           <View>
              <Text>local_shipping</Text>
           </View>
           <Text>Fulfillment Center</Text>
           <Text>No pending physical shipments. All digital assets are handled by the Galaxy Uplink protocol.</Text>
           <Pressable>View Shipping Logs</Pressable>
        </View>
      </View>

      {/* Item Editor Modal */}
      {isEditorOpen && editingItem && (
        <View>
          <View onPress={() => setIsEditorOpen(false)}></View>
          <View>
            <View></View>
            
            <View>
              <Text>{items.find(i => i.id === editingItem.id) ? 'Edit Product' : 'New Creation'}</Text>
              <Pressable onPress={() => setIsEditorOpen(false)}><Text>close</Text></Pressable>
            </View>

            <View>
              {/* Product Visual */}
              <View>
                <Text>Product Visual</Text>
                <View 
                  onPress={() => fileInputRef.current?.click()}
                 
                >
                   <TextInput ref={fileInputRef} onChange={handleImageUpload} />
                   <Image source={{ uri: editingItem.img }} />
                   <View>
                      <View>
                        <Text>photo_camera</Text>
                      </View>
                   </View>
                </View>
              </View>

              {/* Basic Details */}
              <View>
                <Text>Product Name</Text>
                <TextInput 
                  value={editingItem.name}
                  onChangeText={(value) => setEditingItem({...editingItem, name: value})}
                 
                  placeholder="e.g. Neon Stems Pack"
                />
              </View>

              <View>
                <View>
                  <Text>Price (USD)</Text>
                  <View>
                    <Text>$</Text>
                    <TextInput 
                      type="number"
                      value={editingItem.price}
                      onChangeText={(value) => setEditingItem({...editingItem, price: value})}
                     
                    />
                  </View>
                </View>
                <View>
                   <Text>Status</Text>
                   <View 
                    value={editingItem.status}
                    onChangeText={(value) => setEditingItem({...editingItem, status: value as any})}
                   
                   >
                     <Text value="active">Active</Text>
                     <Text value="hidden">Hidden</Text>
                     <Text value="sold-out">Sold Out</Text>
                   </View>
                </View>
              </View>

              {/* Stock Management */}
              <View>
                <View>
                   <View>
                      <Text>inventory_2</Text>
                      <Text>Unlimited Stock</Text>
                   </View>
                   <Pressable 
                    onPress={() => setEditingItem({...editingItem, isUnlimited: !editingItem.isUnlimited})}
                   
                   >
                     <View></View>
                   </Pressable>
                </View>
                {!editingItem.isUnlimited && (
                  <View>
                    <Text>Available Quantity</Text>
                    <TextInput 
                      type="number"
                      value={editingItem.stock === 'Unlimited' ? '100' : editingItem.stock}
                      onChangeText={(value) => setEditingItem({...editingItem, stock: value})}
                     
                    />
                  </View>
                )}
              </View>

              {/* AI Description */}
              <View>
                 <View>
                   <Text>Product Pitch</Text>
                   <Pressable 
                    onPress={generateAiDescription}
                    disabled={isAiLoading || !editingItem.name}
                   
                   >
                     <Text>auto_awesome</Text>
                     {isAiLoading ? 'Magic Drafting...' : 'Magic Describe'}
                   </Pressable>
                 </View>
                 <TextInput 
                  value={editingItem.description}
                  onChangeText={(value) => setEditingItem({...editingItem, description: value})}
                 
                  placeholder="Tell your fans why this drop is special..."
                 />
              </View>

              {/* Action Buttons */}
              <View>
                <Pressable 
                  onPress={saveItem}
                 
                >
                  Publish
                </Pressable>
                {items.find(i => i.id === editingItem.id) && (
                  <Pressable 
                    onPress={() => deleteItem(editingItem.id)}
                   
                  >
                    Delete Product
                  </Pressable>
                )}
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
          {isSaving ? (
            <>
              <View></View>
              Saving Catalog...
            </>
          ) : (
            <>
              Save
              <Text>check</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default CreatorStore;
