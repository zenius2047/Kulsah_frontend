import React, { useState } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  isSystem?: boolean;
}

const LiveStream: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [isTippingModalOpen, setIsTippingModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('10.00');
  const [tipMessage, setTipMessage] = useState('');
  const [isProcessingTip, setIsProcessingTip] = useState(false);
  const [showTipSuccess, setShowTipSuccess] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, user: 'Alex_Vibes', text: 'This set is fire!' },
    { id: 2, user: 'MusicLover99', text: 'Play the new single!' },
    { id: 3, user: 'Sarah', text: 'just tipped $50.00', isSystem: true },
    { id: 4, user: 'BeatMaster', text: 'The lighting is incredible tonight' },
  ]);

  const tipOptions = ['5.00', '10.00', '20.00', '50.00', '100.00'];

  const toggleAIMod = async () => {
    if (aiInsight) {
      setAiInsight(null);
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents:
          "Pretend you are an AI moderator in a live stream for a pop star named Melody Rose. Summarize the chat energy in one short sentence.",
      });
      setAiInsight(response.text || 'Fans are loving the vibe!');
    } catch (e) {
      setAiInsight('Chat is buzzing with positive vibes!');
    }
  };

  const handleSendMsg = () => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), user: 'Me', text: msg }]);
    setMsg('');
  };

  const handleSendTip = () => {
    if (!tipAmount) return;
    setIsProcessingTip(true);
    setTimeout(() => {
      setIsProcessingTip(false);
      setShowTipSuccess(true);

      const fullTipText = tipMessage.trim() ? `just tipped $${tipAmount}: "${tipMessage}"` : `just tipped $${tipAmount}`;
      setMessages((prev) => [...prev, { id: Date.now(), user: 'Me', text: fullTipText, isSystem: true }]);

      setTimeout(() => {
        setShowTipSuccess(false);
        setIsTippingModalOpen(false);
        setTipMessage('');
      }, 1500);
    }, 1000);
  };

  return (
    <View>
      <View>
        <Image source={{ uri: 'https://picsum.photos/seed/livestreambg/1200/800' }} />
      </View>

      <View>
        <View>
          <Image source={{ uri: 'https://picsum.photos/seed/melody/100' }} />
          <View>
            <Text>Melody Rose</Text>
            <Text>14.2k ON-AIR</Text>
          </View>
          <Pressable>
            <Text>Sub</Text>
          </Pressable>
        </View>
        <View>
          <Pressable onPress={toggleAIMod}>
            <Text>auto_awesome</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()}>
            <Text>close</Text>
          </Pressable>
        </View>
      </View>

      {aiInsight && (
        <View>
          <Text>AI Moderator Insights</Text>
          <Text>{aiInsight}</Text>
        </View>
      )}

      <View>
        <View>
          <Text>Limited: Summer Tour</Text>
          <Text>Early access ending soon</Text>
          <Pressable>
            <Text>Buy</Text>
          </Pressable>
        </View>

        <View>
          {messages.map((m) => (
            <View key={m.id}>
              {!m.isSystem && <Image source={{ uri: `https://picsum.photos/seed/fan${m.id}/50` }} />}
              <Text>
                {m.user}: {m.text}
              </Text>
            </View>
          ))}
        </View>

        <View>
          <View>
            <Pressable>
              <Text>favorite</Text>
            </Pressable>
            <Text>1.2M</Text>
          </View>
          <View>
            <Pressable>
              <Text>share</Text>
            </Pressable>
            <Text>Share</Text>
          </View>
          <View>
            <Pressable onPress={() => setIsTippingModalOpen(true)}>
              <Text>redeem</Text>
            </Pressable>
            <Text>Tip</Text>
          </View>
        </View>
      </View>

      <View>
        <TextInput value={msg} onChangeText={setMsg} placeholder="Say something to Melody..." />
        <Pressable onPress={handleSendMsg} disabled={!msg.trim()}>
          <Text>send</Text>
        </Pressable>
      </View>

      {isTippingModalOpen && (
        <View>
          <Pressable disabled={isProcessingTip} onPress={() => setIsTippingModalOpen(false)}>
            <Text>close</Text>
          </Pressable>
          <View>
            <Text>Support Melody</Text>
            <Text>Your support fuels the music. Thank you.</Text>

            {showTipSuccess ? (
              <View>
                <Text>Tip Received!</Text>
              </View>
            ) : (
              <View>
                <Text>Select Amount</Text>
                <View>
                  {tipOptions.map((amount) => (
                    <Pressable key={amount} onPress={() => setTipAmount(amount)}>
                      <Text>${amount}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput value={tipAmount} onChangeText={setTipAmount} placeholder="Other amount" />
                <TextInput value={tipMessage} onChangeText={setTipMessage} placeholder="Write a shoutout..." />
                <Pressable onPress={handleSendTip} disabled={isProcessingTip || !tipAmount}>
                  <Text>
                    {isProcessingTip ? 'Processing...' : `Send $${parseFloat(tipAmount || '0').toFixed(2)} Tip`}
                  </Text>
                </Pressable>
              </View>
            )}
            <Text>100% of tips go directly to Melody Rose.</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default LiveStream;
