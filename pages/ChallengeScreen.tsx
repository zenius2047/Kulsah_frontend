import React, { act, useEffect, useState } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import BadgeIcon from '../assets/icons/badge-svg.svg';
import { mediumScreen, setDark } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import NotificationIcon from '../assets/icons/notifications-svg.svg';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Featured from './Featured';
import MyEntry from './MyEntry';
import ParticipantHistory from './ParticipantHistory';
import { useNavigation } from '@react-navigation/native';



interface Props {
  videoLink: string;
}

const VideoPreview: React.FC<Props> = ({ videoLink }) => {
  const { isDark, theme } = useThemeMode();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoLink) {
      generateThumbnail();
    }
  }, [videoLink]); // ✅ important

  const generateThumbnail = async () => {
    try {
      setLoading(true);

      const { uri } = await VideoThumbnails.getThumbnailAsync(videoLink, {
        time: 1500,
      });

      setThumbnail(uri);
    } catch (e) {
      console.warn("Thumbnail error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading && <View style={{
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ActivityIndicator />
        </View>}

      {thumbnail && !loading && (
        <Image
          source={{ uri: thumbnail }}
          style={{ width: '100%', height: '100%', }}
        />
      )}
    </View>
  );

}













const ChallengeScreen : React.FC = () => {
  const { isDark, theme } = useThemeMode();
const [activeTab, setActiveTab] = useState< string |"Active" | "Featured" | "My Entry" | "History" >("Active");
const navigation = useNavigation<any>()

    const tabs= [
        'Active',
        'Featured',
        'My Entry',
        'History'
    ]

    const activeContents = [
        {
            'creator': 'K-Pop Dance Mania',
            'avatar': 'https://picsum.photos/200',
            'username': 'DanceStudio_SEO',
            'entries':  '12.4K',
            'views' : '2.1M',
            'timeLeft': '2d 14h',
            'tag': 'Hot Now',
            'participants': [
                {
                    'avatar': 'https://plus.unsplash.com/premium_photo-1666900440561-94dcb6865554?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'views' : '12k',
                    'videoLink': 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.09.04+AM.mp4',
                },
                {
                    'avatar': 'https://plus.unsplash.com/premium_photo-1666901328734-3c6eb9b6b979?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'views' : '8.4k',
                    'videoLink': 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.09.04+AM.mp4',
                }
            ]
        },
        {
            'creator': 'K-Pop Dance Mania',
            'avatar': 'https://picsum.photos/200',
            'username': 'DanceStudio_CEO',
            'entries':  '12.4K',
            'views' : '2.1M',
            'timeLeft': '2d 14h',
            'tag': 'Hot Now',
            'participants': [
                {
                    'avatar': 'https://plus.unsplash.com/premium_photo-1666900440561-94dcb6865554?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'views' : '12k',
                    'videoLink': 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.58.23+AM.mp4',
                },
                {
                    'avatar': 'https://plus.unsplash.com/premium_photo-1666901328734-3c6eb9b6b979?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                    'views' : '8.4k',
                    'videoLink': 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+11.58.23+AM.mp4',
                }
            ]
        }
    ]

    // useEffect(()=>{
    //     setDark(true)
    // },[])

    return (
        <View style={{
            backgroundColor: !isDark ?'white': 'black',
            flex: 1,
            // paddingTop: 54,
        }}>
        {/* <View style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            justifyContent: 'space-between',
            // backgroundColor: 'red',
            paddingVertical: 16,
            borderBottomColor: '#ffffff27',
            borderBottomWidth: 1
            
        }}>
            <View style={{
                gap: 15,
                alignItems: 'center',
                flexDirection: 'row'
            }}>
                <BadgeIcon height={34} width={34} fill='#cd2bee'/>
            <Text style={{
                fontFamily: "PlusJakartaSansBold",
                fontSize: mediumScreen ? 22: 16,
                color: !isDark ? 'black': 'white',
            }}>
                Arena
            </Text>
            </View>
            <View style={{
                flexDirection: 'row',
                gap: 25,
                alignItems: 'center'
            }}>
                <MaterialIcons name='search' color={!isDark ? 'black': 'white'} size={24}/>
                <NotificationIcon fill={!isDark ? 'black': 'white'} height={24} width={24}/>
            </View>
        </View> */}
        
        {/* Active, Featured..... tabs */}
        <View style={{
            flexDirection: 'row',
            gap: 15,
            alignItems: 'center',
            paddingHorizontal: 16,
            marginTop: 15,
        }}>
            {tabs.map((tab)=>(
                <Pressable
                key={tab}
                onPress={()=>{setActiveTab(tab)}}
                style={{
                    // gap: 5,
                
                
                }}>
                 <Text style={{
                    color: activeTab === tab ? '#cd2bee': !isDark ? 'black':'grey',
                    fontFamily: "PlusJakartaSansBold",
                    fontSize: mediumScreen ? 18: 14,
                    marginBottom: 15,
                 }}>
                    {tab}
                 </Text>
                 {activeTab === tab && <View
                 style={{
                    height: 3,
                    backgroundColor: '#cd2bee',
                 }}
                 />}
                </Pressable>))}
        </View>
        
        {activeTab === 'Active' && 
        <ScrollView
        showsVerticalScrollIndicator = {false}
        >
        {activeContents.map((content)=>(
        <View 
        key = {content.username}
        style={{
            marginTop: 35,
            borderRadius: 36,
            // backgroundColor: 'gold',
            paddingHorizontal: 14,
            paddingVertical: 14,
            marginHorizontal: 16,
            borderColor: isDark ?'#ffffff40': '#00000040',
            borderWidth: 1,
        }}>
        
        {/*First Row........... */}
        <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between'
        }}>
            <View style={{
                borderRadius: 999,
                width: 60,
                height: 60,
                // backgroundColor: 'blue',
                borderColor: '#cd2bee',
                borderWidth: 2,
                
            }}>
                <Image
                source={{uri: content.avatar}}
                // height = {60}
                // width = {60}
                style={{
                borderRadius: 999,
                height: '100%',
                width: '100%'
                }}
                />
                
            </View>
            <View>
                <Text style={{
                    fontSize: mediumScreen ? 18: 14,
                    fontFamily: 'PlusJakartaSansBold',
                    color: isDark ? 'white': 'black',
                }}>
                    {content.creator}
                </Text>
                <Text style={{
                    fontSize: mediumScreen ? 14: 10,
                    fontFamily: 'PlusJakartaSans',
                    color: isDark ? 'grey': 'black',
                }}>
                    by @{content.username}
                </Text>
            </View>
            <View style={{
                backgroundColor: '#cd2bee34',
                borderRadius: 18,
                // paddingVertical: 3,
                paddingHorizontal: 12,
                height: '50%',
                alignItems: 'center',
                borderColor: '#cd2bee',
                borderWidth: 1,
            }}>
                <Text 
                numberOfLines={1}
                style={{
                    color: '#cd2bee',
                    fontFamily: 'PlusJakartaSansBold',
                    fontSize: mediumScreen ? 16 : 12,
                }}>
                    {content.tag}
                </Text>
            </View>
        </View>


        {/*Entries, views, time left */}
        <View style={{
            backgroundColor: isDark ?'#ffffff17':"#00000017",
            height: 65,
            borderRadius: 32,
            marginTop: 15,
            flexDirection: 'row',
            // justifyContent: 'space-between',
            alignItems: 'center',
            paddingRight: 18
        }}>
        
        {[1,2,3].map((item)=>(
            <View 
            key={item}
            style={{
                borderRightWidth: item !== 3 ? 0.5 : 0,
                borderRightColor: 'grey',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 12,
                // backgroundColor: item ==1 ? 'red': 'blue',
                width: '35%'
            }}>
            <Text style={{
                color: isDark ? 'grey' : 'black',
                fontFamily: 'PlusJakartaSansBold',
                fontSize: mediumScreen ? 16: 12,
                // paddingHorizontal: 12,
                // paddingTop: 12,
            }}>
                {item === 1 ? 'ENTRIES': item===2 ? 'VIEWS': 'TIME LEFT'}
            </Text>
            <Text style={{
                color: isDark ? item===3 ? '#cd2bee':'white' : item===3 ? '#cd2bee':'black',
                fontFamily: 'PlusJakartaSansBold',
                fontSize: mediumScreen ? 14: 10,
                paddingHorizontal: 12,
            }}>
                {item === 1 ? content.entries: item===2 ? content.views: content.timeLeft}
            </Text>
            </View>))}

        </View>

        {/* Recent Participants */}
        <View style={{
            flexDirection: 'row',
            marginTop: 15,
            justifyContent: 'space-between',
            paddingHorizontal: 6
        }}>
            <Text style={{
                color: isDark ? 'grey': 'black',
                fontSize: mediumScreen ? 14 : 10,
                fontFamily: 'PlusJakartaSansBold',
            }}>
                RECENT PARTICIPANTS
            </Text>
             <Pressable
                onPress={()=>(
                    navigation.navigate("challengeParticipants")
                )}
             >
                <Text style={{
                color: 'purple',
                fontSize: mediumScreen ? 14 : 10,
                fontFamily: 'PlusJakartaSansBold',
             }}>
                VIEW ALL
            </Text>
             </Pressable>
        </View>
        
        {/*Participants............. */}
        <View style={{
            flexDirection: 'row',
            gap: 15,
            marginTop: 15,
        }}>
        {content.participants.map((participant =>(
            <View
            key = {participant.avatar}
            style={{
                height: 250,
                width: 150,
                // backgroundColor: 'blue',
                borderRadius: 36,
                overflow: 'hidden'
            }}
            >
            <VideoPreview
            videoLink= {participant.videoLink}
            />
            <View >

            </View>
            </View>
        )))}
        </View>

        <Pressable
        onPress={()=>{
            navigation.navigate("SubmitEntry")
        }}
        style={{
            backgroundColor: '#cd2bee',
            height: 60,
            marginTop: 20,
            borderRadius: 32,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
        <MaterialIcons name='add-circle' size={24} color='white'/>
        <Text style={{
            fontFamily: 'PlusJakartaSansBold',
            color: isDark ? 'white': 'black',
            fontSize: mediumScreen ? 20: 16,
            lineHeight: 35
        }}>
            {'  Join Challenge'}
        </Text>
        </Pressable>

        </View>))}
        <View
        style={{
            height: 150,
        }}
        />
        </ScrollView>}
        
        {activeTab === 'Featured' && <Featured/>}
        {activeTab === 'My Entry' && <MyEntry />}
        {activeTab === 'History' && <ParticipantHistory />}





        
        </View>
    )
};
export default ChallengeScreen;
