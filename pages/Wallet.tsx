import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const Wallet: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'pass' | 'tickets'>('pass');

  const tickets = [
    { 
      id: 'burna-boy-ticket', 
      title: 'Burna Boy: Love, Damini', 
      date: 'Aug 24', 
      location: 'O2 Arena • Section A', 
      status: 'upcoming', 
      img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=400' 
    }
  ];

  return (
    <View>
      <View>
        <View>
          <Pressable onPress={() => navigation.navigate('/explore')}>
            <Text>chevron_left</Text>
          </Pressable>
          <Text>My Galaxy</Text>
        </View>
        <View>
          <View>
            <Text>verified</Text>
            <Text>Verified</Text>
          </View>
        </View>
      </View>

      <View>
        {/* Tab Selection */}
        <View>
          <Pressable 
            onPress={() => setActiveTab('pass')}
           
          >
            Identity Pass
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('tickets')}
           
          >
            My Tickets
          </Pressable>
        </View>

        {activeTab === 'pass' ? (
          <View>
            <View 
              onPress={() => setIsFlipped(!isFlipped)}
             
            >
              {/* Front Side */}
              <View>
                <View></View>
                <View></View>
                
                <View>
                  <View>
                    <Text>Identity Card</Text>
                    <Text>ALEX{'\\n'}RIVERA</Text>
                  </View>
                  <View>
                    <Text>stars</Text>
                  </View>
                </View>

                <View>
                  <View>
                    <Image source={{ uri: "https://picsum.photos/seed/alex/300" }} />
                    <View></View>
                  </View>
                  <View>
                    <Text>Founding Member</Text>
                    <Text>Kulsah Galaxy #0042</Text>
                  </View>
                </View>

                <View>
                  <View>
                    ECOSYSTEM ID: KULS-8829-X
                  </View>
                  <View>
                    <Text>contactless</Text>
                    <Text>nfc</Text>
                  </View>
                </View>
              </View>

              {/* Back Side (Dynamic QR Code) */}
              <View>
                <View>
                  <Image 
                    source={{ uri: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ALEX_RIVERA_KULSAH&bgcolor=ffffff&color=0f172a" }} 
                    
                    
                  />
                </View>
                <Text>Digital Access</Text>
                <Text>Dynamic Key Refreshes in 12 seconds</Text>
                <View>
                  {[1, 2, 3, 4, 5].map(i => <View key={i}><View style={{ animationDelay: `${i * 0.2}s` }}></View></View>)}
                </View>
              </View>
            </View>
            <Text>
              <Text>touch_app</Text> Tap Card to Flip
            </Text>
          </View>
        ) : (
          <View>
            <View>
              <Text>Active Tickets</Text>
              <Text>{tickets.length} Events</Text>
            </View>
            
            <View>
              {tickets.map((ticket) => (
                <View key={ticket.id}>
                  <View>
                    <Image source={{ uri: ticket.img }} />
                    <View></View>
                    <View>
                      {ticket.date}
                    </View>
                  </View>
                  <View>
                    <Text>{ticket.title}</Text>
                    <View>
                      <Text>location_on</Text>
                      <Text>{ticket.location}</Text>
                    </View>
                    <View>
                      <Pressable 
                        onPress={() => navigation.navigate(`/ticket/${ticket.id}`)}
                       
                      >
                        <Text>qr_code_2</Text>
                        Open Ticket
                      </Pressable>
                      <Pressable>
                        <Text>share</Text>
                      </Pressable>
                    </View>
                  </View>
                  {/* Decorative Ticket Perforation */}
                  <View></View>
                  <View></View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Perks Section */}
        <View>
          <Text>Member Privileges</Text>
          <View>
            <View>
              <Text>airport_shuttle</Text>
              <Text>Fast-track Entry</Text>
              <Text>Unlimited use</Text>
            </View>
            <View>
              <Text>shopping_bag</Text>
              <Text>Merch Discount</Text>
              <Text>15% Off storewide</Text>
            </View>
          </View>
        </View>
      </View>

      <style>{`
        .perspective-2000 { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes shimmer {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </View>
  );
};

export default Wallet;
