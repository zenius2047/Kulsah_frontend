import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

const CreateCommunityPost: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<'all' | 'subs'>('all');
  const [isPosting, setIsPosting] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  
  const fileInputRef = useRef<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateAiSpark = async () => {
    setIsAiDrafting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Draft a high-energy community update for a creator to their fans. Focus on 'exclusive BTS content' and 'upcoming tour rumors'. 1 sentence only.",
      });
      setContent(response.text?.trim() || "");
    } catch (e) {
      setContent("Rumor has it something big is dropping. Stay tuned for exclusive BTS content this weekend! 🌌");
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handlePublish = () => {
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      navigation.navigate('/dashboard');
    }, 1500);
  };

  return (
    <View>
      <View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>close</Text>
        </Pressable>
        <Text>Compose Post</Text>
        <Pressable 
          onPress={handlePublish}
          disabled={!content.trim() || isPosting}
         
        >
          {isPosting ? 'Sending...' : 'Publish'}
        </Pressable>
      </View>

      <View>
        {/* Editor Area */}
        <View>
          <View>
             <View>
                <View>
                   <Image source={{ uri: "https://picsum.photos/seed/mila/100" }} />
                </View>
                <View>
                   <Text>Mila Ray</Text>
                   <Text>Posting to Galaxy</Text>
                </View>
             </View>
             <Pressable 
                onPress={generateAiSpark}
                disabled={isAiDrafting}
               
             >
                <Text>auto_awesome</Text>
                AI Draft
             </Pressable>
          </View>

          <View>
             <TextInput 
               value={content}
               onChangeText={(value) => setContent(value)}
              
               placeholder="What's happening in your universe?"
             />
          </View>

          {attachedImage && (
            <View>
               <Image source={{ uri: attachedImage }} />
               <Pressable 
                onPress={() => setAttachedImage(null)}
               
               >
                 <Text>close</Text>
               </Pressable>
            </View>
          )}
        </View>

        {/* Toolbar */}
        <View>
           <View>
              <Pressable 
                onPress={() => fileInputRef.current?.click()}
               
              >
                 <Text>image</Text>
                 <TextInput ref={fileInputRef} onChange={handleImageUpload} />
              </Pressable>
              <Pressable>
                 <Text>poll</Text>
              </Pressable>
              <Pressable>
                 <Text>schedule</Text>
              </Pressable>
           </View>
           
           <View>
              <Pressable 
                onPress={() => setTargetAudience('all')}
               
              >
                Public
              </Pressable>
              <Pressable 
                onPress={() => setTargetAudience('subs')}
               
              >
                <Text>stars</Text>
                Subs Only
              </Pressable>
           </View>
        </View>
      </View>
    </View>
  );
};

export default CreateCommunityPost;
