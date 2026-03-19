import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  color?: string;
  isTip?: boolean;
  isSystem?: boolean;
}

const CreatorLiveStream: React.FC = () => {
  const navigation = useNavigation<any>();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Session State
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamFlipped, setIsCamFlipped] = useState(false);
  const [aiAudit, setAiAudit] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");

  // Tipping Simulation State
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [simTipAmount, setSimTipAmount] = useState("10.00");
  const [isProcessingSim, setIsProcessingSim] = useState(false);
  const [showSimSuccess, setShowSimSuccess] = useState(false);

  // Telemetry State (Simulated live updates)
  const [viewers, setViewers] = useState(14284);
  const [likes, setLikes] = useState(128400);
  const [tips, setTips] = useState(1240.50);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, user: 'Alex_Vibes', text: 'This lighting is next level! 💜', color: 'text-primary' },
    { id: 2, user: 'Sarah_Music', text: 'Play the new single!', color: 'text-white' },
    { id: 3, user: 'BeatMaster', text: 'Tipped $50.00: "You are a legend!"', isTip: true },
    { id: 4, user: 'Nova_Fan', text: 'Watching from Lagos! 🇳🇬', color: 'text-white' },
  ]);

  // Timers and Simulations
  useEffect(() => {
    const timer = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    const telemetryInterval = setInterval(() => {
      setViewers(v => v + Math.floor(Math.random() * 10) - 4);
      setLikes(l => l + Math.floor(Math.random() * 50));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(telemetryInterval);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTimer = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAIEnergyAudit = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a live session moderator for a creator named Mila Ray. Summarize the current chat energy (fans are requesting new music and showing lots of love from Nigeria) in 1 high-energy futuristic sentence for Mila to read aloud.`,
      });
      setAiAudit(response.text || "Your global audience is buzzing! The energy is through the roof—keep the beats coming.");
    } catch (e) {
      setAiAudit("Energy levels at 98.4%. Fans from the African sector are requesting 'Nebula'. You're owning the stage!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBroadcast = () => {
    if (!broadcastText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now(),
      user: 'SYSTEM',
      text: broadcastText,
      isSystem: true
    };
    setChatMessages(prev => [...prev, newMessage]);
    setBroadcastText("");
  };

  const executeSimulatedTip = () => {
    setIsProcessingSim(true);
    setTimeout(() => {
      const amount = parseFloat(simTipAmount);
      setTips(prev => prev + amount);
      
      const newTipMsg: ChatMessage = {
        id: Date.now(),
        user: 'Simulated_Fan',
        text: `just tipped $${amount.toFixed(2)} (Live Demo)`,
        isTip: true
      };
      
      setChatMessages(prev => [...prev, newTipMsg]);
      setIsProcessingSim(false);
      setShowSimSuccess(true);
      
      setTimeout(() => {
        setShowSimSuccess(false);
        setIsTipModalOpen(false);
      }, 1500);
    }, 1200);
  };

  const handleEndSession = () => {
    navigation.navigate('/dashboard');
  };

  return (
    <View>
      {/* Active Stream Canvas (Simulated) */}
      <View>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=1200" }} 
          
          
        />
        <View></View>
      </View>

      {/* Top Telemetry HUD */}
      <View>
        <View>
           <View>
              <View></View>
              <Text>{formatTimer(sessionSeconds)}</Text>
           </View>
           
           <View>
              <Pressable 
                onPress={getAIEnergyAudit}
                disabled={isAiLoading}
               
                title="Get AI Energy Audit"
              >
                <Text>auto_awesome</Text>
              </Pressable>
              <Pressable 
                onPress={() => setShowEndConfirm(true)}
               
              >
                End Session
              </Pressable>
           </View>
        </View>

        {/* Real-time Stats Rail */}
        <View>
           {[
             { label: 'Viewers', val: viewers.toLocaleString(), icon: 'visibility', color: 'text-blue-400' },
             { label: 'Likes', val: (likes / 1000).toFixed(1) + 'k', icon: 'favorite', color: 'text-primary' },
             { label: 'Tips', val: `$${tips.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'redeem', color: 'text-green-400' },
             { label: 'Uplink', val: '98%', icon: 'signal_cellular_alt', color: 'text-emerald-400' },
           ].map((stat, i) => (
             <View key={i}>
                <Text>
                <View>
                   <Text>{stat.label}</Text>
                   <Text>{stat.val}</Text>
                </View>
             </View>
           ))}
        </View>
      </View>

      {/* AI Energy Insight Overlay */}
      {aiAudit && (
        <View>
          <View>
             <Pressable 
               onPress={() => setAiAudit(null)} 
              
             >
               <Text>close</Text>
             </Pressable>
             <View>
                <Text>psychology</Text>
                <Text>Astro-Brain Intelligence</Text>
             </View>
             <Text>"{aiAudit}"</Text>
          </View>
        </View>
      )}

      {/* Bottom Controls Area */}
      <View>
        <View>
           {/* Chat Feed */}
           <View>
              {chatMessages.map((m) => (
                <View key={m.id}>
                   {!m.isSystem && (
                     <View>
                        <Image source={{ uri: `https://picsum.photos/seed/fan${m.id }}/50`} />
                     </View>
                   )}
                   <View>
                      <Text>{m.user}</Text>
                      <Text>{m.text}</Text>
                   </View>
                   {m.isTip && <Text>verified</Text>}
                   {m.isSystem && <Text>campaign</Text>}
                </View>
              ))}
              <View ref={chatEndRef} />
           </View>

           {/* Creator HUD Side Controls */}
           <View>
              <Pressable 
                onPress={() => setIsTipModalOpen(true)}
               
                title="Simulate Fan Tip"
              >
                <Text>redeem</Text>
              </Pressable>

              <Pressable 
                onPress={() => setIsCamFlipped(!isCamFlipped)}
               
                title="Flip Camera"
              >
                <Text>flip_camera_ios</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setIsMuted(!isMuted)}
               
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                <Text>{isMuted ? 'mic_off' : 'mic'}</Text>
              </Pressable>

              <View>
                 <View>
                    {[1,2,3,4,5,6].map(i => (
                      <View 
                        key={i} 
                        
                        style={{ 
                          height: isMuted ? '2px' : `${20 + Math.random() * 80}%`, 
                          animationDuration: `${0.3 + i*0.08}s`,
                          animationDelay: `${i*0.05}s`
                        }}
                      />
                    ))}
                 </View>
              </View>
           </View>
        </View>

        {/* System Broadcast Input */}
        <View>
           <View>
              <TextInput 
                value={broadcastText}
                onChangeText={(value) => setBroadcastText(value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
               
                placeholder="Broadcast a system alert..."
              />
              <Pressable 
                onPress={handleBroadcast}
                disabled={!broadcastText.trim()}
               
              >
                campaign
              </Pressable>
           </View>
           <Pressable>
              <Text>more_horiz</Text>
           </Pressable>
        </View>
      </View>

      {/* Tipping Simulation Modal */}
      {isTipModalOpen && (
        <View>
          <View onPress={() => !isProcessingSim && setIsTipModalOpen(false)}></View>
          <View>
            <View></View>
            
            <View>
              <Text>Fan Tip Simulation</Text>
              <Text>Test your live alerts & revenue HUD</Text>
            </View>

            {showSimSuccess ? (
              <View>
                <View>
                   <Text>check_circle</Text>
                </View>
                <Text>Uplink Success</Text>
              </View>
            ) : (
              <>
                <View>
                  <Text>Select Mock Amount</Text>
                  <View>
                    {["5.00", "10.00", "20.00", "50.00", "100.00"].map((amount) => (
                      <Pressable 
                        key={amount}
                        onPress={() => setSimTipAmount(amount)}
                       
                      >
                        ${amount}
                      </Pressable>
                    ))}
                    <View>
                      <TextInput 
                        type="number" 
                        value={simTipAmount}
                        onChangeText={(value) => setSimTipAmount(value)}
                       
                        placeholder="Other"
                      />
                    </View>
                  </View>
                </View>

                <View>
                   <Text>Simulation Mode</Text>
                   <Text>This will simulate an incoming fan tip in your chat feed and update your session revenue metrics.</Text>
                </View>

                <Pressable 
                  onPress={executeSimulatedTip}
                  disabled={isProcessingSim || !simTipAmount}
                 
                >
                  {isProcessingSim ? (
                    <View></View>
                  ) : (
                    <>
                      Confirm Mock Tip
                      <Text>bolt</Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {/* Session Termination Protocol Overlay */}
      {showEndConfirm && (
        <View>
           <View onPress={() => setShowEndConfirm(false)}></View>
           <View>
              <View>
                <View>
                   <Text>sensors_off</Text>
                </View>
                <View></View>
              </View>

              <View>
                <Text>Shutdown Protocol</Text>
                <Text>Terminating the transmission will finalize session revenue and disconnect all <Text>{viewers.toLocaleString()}</Text> viewers.</Text>
              </View>

              <View>
                 <Pressable 
                  onPress={handleEndSession}
                 
                 >
                   Confirm Shutdown
                 </Pressable>
                 <Pressable 
                  onPress={() => setShowEndConfirm(false)}
                 
                 >
                   Keep Streaming
                 </Pressable>
              </View>
           </View>
        </View>
      )}

      <style>{`
        .mask-linear-gradient {
          mask-image: linear-gradient(to top, black 80%, transparent 100%);
        }
        .shadow-glow {
          box-shadow: 0 0 30px rgba(205, 43, 238, 0.4);
        }
      `}</style>
    </View>
  );
};

export default CreatorLiveStream;
