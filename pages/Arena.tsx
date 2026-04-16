import React, { useEffect, useState } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Platform } from 'react-native';
import { mediumScreen } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import NotificationIcon from '../assets/icons/notifications-svg.svg';
import Community from './Community';
import ChallengeScreen from './ChallengeScreen';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreatorChallenges from './CreatorChallenges';


const Arena :React.FC = ({route}:any)=>{
    const { isDark, theme } = useThemeMode();
    const [activeTab, setActiveTab] = useState<string | "challenges" | "community">('community');
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    useEffect(()=>{
        const tabToRoute = route?.params?.tabToRoute;
        if(tabToRoute){
            setActiveTab(tabToRoute)
        }
    }, [route?.params?.tabToRoute])

    return (
    <View style={{
        backgroundColor: theme.background,
        flex: 1,
        paddingTop: Platform.OS == 'ios' ? 54: insets.top,
    }}>
    
    {/* <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingBottom: 12,
        backgroundColor: 'white'
    }}>
        <MaterialIcons name='chevron-left' size={34} color={theme.text}/>
        <Text style={{
            color: theme.text,
            fontFamily: 'PlusJakartaSansExtraBold',
            fontSize: mediumScreen ? 22: 18,
            lineHeight:25,
        }}> Arena
            </Text>
        <View style={{
            flexDirection: 'row',
            alignItems:'center',
            justifyContent: 'flex-end',
            width: '70%',
            // backgroundColor: 'red',
            paddingRight: 16,
        }}>
            <NotificationIcon
        height={30}
        width={30}
        fill={isDark ? 'white': 'black'}
        />
        {activeTab === 'challenges' && <Pressable 
        onPress= {()=>{
            navigation.navigate('CreateChallenge');
        }}
        style={{
            height: 40,
            width: 40,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accent,
            // paddingHorizontal: 12,
            borderRadius: 999,
        }}>
           <MaterialIcons name="add" color={theme.background} size={24}/>
        </Pressable>}
        </View>
    </View> */}
    {/*Main Tabs........... "Community" & Challenges */}
    <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 15,
        backgroundColor: theme.screen,
    }}>
    {["community","challenges"].map((item)=>(
        <Pressable 
        key={item}
        onPress={()=>setActiveTab(item)}
        style={{
            justifyContent: 'center',
            alignItems: 'center'
        }}>
        <Text style={{
            // color: activeTab == item ? theme.accent : theme.textSecondary,
            color: activeTab === item ? isDark ? '#ffffff': '#000000': isDark ? '#ffffff5d':'#0000005d',
            textTransform: 'capitalize',
            fontFamily: "PlusJakartaSansBold",
            fontSize: mediumScreen ? 20: 16,
            marginBottom: 10
        }}>
            {item}
        </Text>
        {activeTab === item && <View
        style={{
            height: 2.5,
            width: 70,
            backgroundColor: '#cd2bee',
            
        }}
        />}
        </Pressable>
    ))}
    </View>

    {activeTab == 'community' && <Community/>}
    {activeTab == 'challenges' && <CreatorChallenges/>}
    </View>);
}
export default Arena;
