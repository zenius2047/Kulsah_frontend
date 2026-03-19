import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const navigation = useNavigation<any>();
  const [locationInsights, setLocationInsights] = useState<string>("");
  const [venueMapUri, setVenueMapUri] = useState<string | null>(null);
  const [venueSnippets, setVenueSnippets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  
  // Reminder State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState<string | null>(null);

  const reminderOptions = [
    { label: '30 minutes before', value: '30m' },
    { label: '1 hour before', value: '1h' },
    { label: '6 hours before', value: '6h' },
    { label: '1 day before', value: '1d' },
    { label: '1 week before', value: '1w' },
  ];

  const getNearbyGuide = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Corrected model name and usage for Gemini Maps Grounding.
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Find the location for the O2 Arena and suggest the best places to eat or park nearby for a concert night.",
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      setLocationInsights(response.text || "Check local guides for the best experience!");

      // Extract URI and place sources accurately
      const candidates = (response as any).candidates;
      if (candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const metadata = candidates[0].groundingMetadata;
        const chunks = metadata.groundingChunks;
        
        // Find Map URI
        const mapChunk = chunks.find((c: any) => c.maps?.uri);
        if (mapChunk?.maps?.uri) {
          setVenueMapUri(mapChunk.maps.uri);
        }

        // Collect Review Snippets
        const snippets: string[] = [];
        chunks.forEach((c: any) => {
          const sources = c.maps?.placeAnswerSources;
          if (sources?.reviewSnippets) {
            sources.reviewSnippets.forEach((snippet: any) => {
              if (snippet?.text) snippets.push(snippet.text);
              else if (typeof snippet === 'string') snippets.push(snippet);
            });
          }
        });
        setVenueSnippets(snippets.slice(0, 3));
      }
    } catch (e) {
      console.error("Gemini Error:", e);
      setLocationInsights("Check our official venue partner page for parking and dining info.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNearbyGuide();
  }, []);

  const triggerToast = (message: string) => {
    setShowToast({ show: true, message });
    setTimeout(() => setShowToast({ show: false, message: '' }), 3000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Burna Boy: Love, Damini Live | Kulsah',
      text: 'Join me at the Burna Boy: Love, Damini World Tour! Get your tickets on Kulsah.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleSetReminder = (option: typeof reminderOptions[0]) => {
    setActiveReminder(option.value);
    setIsReminderModalOpen(false);
    triggerToast(`Reminder set for ${option.label}!`);
  };

  const removeReminder = () => {
    setActiveReminder(null);
    setIsReminderModalOpen(false);
    triggerToast('Reminder removed');
  };

  return (
    <View>
      <View>
        <Image source={{ uri: "https://picsum.photos/seed/eventdetail/800/600" }} />
        <View></View>
        
        {/* Navigation Actions */}
        <Pressable 
          onPress={() => navigation.goBack()}
         
          aria-label="Go back"
        >
          <Text>arrow_back</Text>
        </Pressable>

        <View>
          <Pressable 
            onPress={() => setIsReminderModalOpen(true)}
           
            aria-label="Set reminder"
          >
            <Text>
              {activeReminder ? 'notifications_active' : 'notifications'}
            </Text>
          </Pressable>
          
          <Pressable 
            onPress={handleShare}
           
            aria-label="Share event"
          >
            <Text>share</Text>
          </Pressable>
        </View>

        {/* Success Toast */}
        {showToast.show && (
          <View>
            {showToast.message}
          </View>
        )}
      </View>

      <View>
        <View>
          <View>
            <View>
              <Text>World Tour 2024</Text>
              <Text>Burna Boy: Love, Damini Live</Text>
            </View>
            <View>
              Selling Fast
            </View>
          </View>

          <View>
            <View>
              <View>
                <Text>calendar_month</Text>
              </View>
              <View>
                <Text>Saturday, Aug 24</Text>
                <Text>Starts at 8:00 PM</Text>
              </View>
            </View>
            <View>
              <View>
                <Text>location_on</Text>
              </View>
              <View>
                <Text>The O2 Arena</Text>
                <Text>Peninsula Square, London</Text>
              </View>
            </View>
          </View>

          <View>
            <View>
              <Text>Venue Map & Insights</Text>
              {loading && <View></View>}
            </View>
            
            <View>
              {/* Visual Map Placeholder Card */}
              <View onPress={() => venueMapUri && window.open(venueMapUri, '_blank')}>
                <Image source={{ uri: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800" }} />
                <View></View>
                <View>
                  <Text>location_on</Text>
                  <Text>Tap to navigate</Text>
                </View>
              </View>

              <View>
                <Text>{locationInsights}</Text>
                
                {venueSnippets.length > 0 && (
                  <View>
                    <Text>Fan Pro-Tips</Text>
                    {venueSnippets.map((snippet, idx) => (
                      <View key={idx}>
                        <Text>chat_bubble</Text>
                        <Text>"{snippet}"</Text>
                      </View>
                    ))}
                  </View>
                )}

                {venueMapUri && (
                  <a 
                    href={venueMapUri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                   
                  >
                    <Text>directions</Text>
                    Find Best Route
                  </a>
                )}
              </View>
            </View>
          </View>
        </View>

        <View>
          <Text>About the Event</Text>
          <Text>
            The African Giant returns to London for an unforgettable night of Afrobeats, culture, and high-energy performance. Featuring special guests and immersive 360 visuals.
          </Text>
        </View>

        <View>
          <Text>Tickets</Text>
          <View>
            <View>
              <View>
                <Text>Standard Standing</Text>
                <Text>Limited availability</Text>
              </View>
              <Text>$125.00</Text>
            </View>
            <View>
              <View>
                <Text>VIP Pit Access</Text>
                <Text>Includes merch pack</Text>
              </View>
              <Text>$350.00</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Reminder Selection Modal */}
      {isReminderModalOpen && (
        <View>
          <View 
            
            onPress={() => setIsReminderModalOpen(false)}
          ></View>
          <View>
            <View></View>
            <View>
              <Text>Set Event Reminder</Text>
              <Text>Get notified before the show starts</Text>
            </View>

            <View>
              {reminderOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleSetReminder(option)}
                 
                >
                  <Text>{option.label}</Text>
                  {activeReminder === option.value && (
                    <Text>check_circle</Text>
                  )}
                </Pressable>
              ))}
            </View>

            {activeReminder && (
              <Pressable
                onPress={removeReminder}
               
              >
                Remove Existing Reminder
              </Pressable>
            )}

            <Pressable
              onPress={() => setIsReminderModalOpen(false)}
             
            >
              Cancel
            </Pressable>
          </View>
        </View>
      )}

      <View>
        <Pressable 
          onPress={() => navigation.navigate(`/event/${id}/tickets`)}
         
        >
          Select Tickets
          <Text>arrow_forward</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default EventDetail;
