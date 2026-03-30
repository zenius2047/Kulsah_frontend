import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const FanTicketDetail: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const { id } = useParams();
  const navigation = useNavigation<any>();
  const [brightness, setBrightness] = useState(100);

  // Auto-brighten screen for QR scanning (simulated)
  useEffect(() => {
    // In a real app, we'd use a Capacitor/Native bridge for brightness
  }, []);

  return (
    <View>
      {/* Dynamic Background */}
      <View>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800" }} 
          
          
        />
        <View></View>
      </View>

      <View>
        <Pressable onPress={() => navigation.goBack()}>
          <Text>close</Text>
        </Pressable>
        <View>
          <Text>Entry Pass</Text>
          <Text>Burna Boy: Love, Damini</Text>
        </View>
        <Pressable>
          <Text>share</Text>
        </Pressable>
      </View>

      <View>
        {/* Ticket Body */}
        <View>
          {/* Visual Header */}
          <View>
            <Image source={{ uri: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800" }} />
            <View></View>
            <View>
              <View>
                <Text>Burna Boy</Text>
                <Text>Love, Damini World Tour</Text>
              </View>
              <View>Verified</View>
            </View>
          </View>

          {/* Details Grid */}
          <View>
            <View>
              <Text>Date & Time</Text>
              <Text>Aug 24, 2024</Text>
              <Text>8:00 PM BST</Text>
            </View>
            <View>
              <Text>Venue</Text>
              <Text>The O2 Arena</Text>
              <Text>London, UK</Text>
            </View>
            <View>
              <Text>Section</Text>
              <Text>Golden Circle Pit</Text>
            </View>
            <View>
              <Text>Gate / Seat</Text>
              <Text>Gate B • G-42</Text>
            </View>
          </View>

          {/* QR Area */}
          <View>
            <View>
              <Image 
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ENTRY_CODE_${id }}_ALEX_RIVERA&bgcolor=ffffff&color=0f172a`} 
                
                
              />
            </View>
            <Text>SCAN TO ENTER</Text>
            <Text>Screen brightness optimized for scanner</Text>
          </View>

          {/* Footer Card */}
          <View>
            <View>
              <Text>Digital Ticket ID</Text>
              <Text>PULS-EVT-882-XR9</Text>
            </View>
            <View>
              <Text>nfc</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View>
          <Pressable>
            <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" }} />
            <Text>Apple Wallet</Text>
          </Pressable>
          <Pressable>
            <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" }} />
            <Text>Add to Wallet</Text>
          </Pressable>
        </View>
      </View>

      {/* Decorative Perforation Design */}
      <View></View>
      <View></View>
    </View>
  );
};

export default FanTicketDetail;
