import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { View, Text, Pressable, Platform, StyleSheet, PanResponder } from 'react-native';
import { mediumScreen } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import Community from './Community';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreatorChallenges from './CreatorChallenges';
import Discover from './Discover';



import { fontSize } from '../typography';

type ArenaTab = 'community' | 'discover' | 'challenges';
const ARENA_TABS: ArenaTab[] = ['community', 'discover', 'challenges'];

const Arena :React.FC = ({route}:any)=>{
    const { isDark, theme } = useThemeMode();
    const [activeTab, setActiveTab] = useState<ArenaTab>('community');
    const [isDiscoverSwipeAreaActive, setIsDiscoverSwipeAreaActive] = useState(false);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(), []);
    const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
    const swipeHandledRef = useRef(false);

    useEffect(()=>{
        const tabToRoute = route?.params?.tabToRoute as ArenaTab | undefined;
        if(tabToRoute && ARENA_TABS.includes(tabToRoute)){
            setActiveTab(tabToRoute)
        }
    }, [route?.params?.tabToRoute])

    useEffect(() => {
      setIsDiscoverSwipeAreaActive(false);
    }, [activeTab]);


     const handleTabSwipe = useCallback((direction: 'left' | 'right') => {
        setActiveTab((currentTab) => {
          const currentIndex = ARENA_TABS.indexOf(currentTab);
          if (currentIndex === -1) return currentTab;
    
          if (direction === 'left') {
            return ARENA_TABS[Math.min(currentIndex + 1, ARENA_TABS.length - 1)];
          }
    
          return ARENA_TABS[Math.max(currentIndex - 1, 0)];
        });
      }, []);
    
      const panResponder = useMemo(
        () =>
          PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
              !(activeTab === 'discover' && isDiscoverSwipeAreaActive) &&
              Math.abs(gestureState.dx) > 44 &&
              Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
            onPanResponderGrant: () => {
              swipeHandledRef.current = false;
            },
            onPanResponderMove: (_, gestureState) => {
              if (swipeHandledRef.current || Math.abs(gestureState.dx) < 48) {
                return;
              }
    
              swipeHandledRef.current = true;
              handleTabSwipe(gestureState.dx < 0 ? 'left' : 'right');
            },
            onPanResponderRelease: () => {
              swipeHandledRef.current = false;
            },
            onPanResponderTerminate: () => {
              swipeHandledRef.current = false;
            },
          }),
        [activeTab, handleTabSwipe, isDiscoverSwipeAreaActive]
      );
    

    return (
    <View
        {...panResponder.panHandlers}
        style={{
        backgroundColor: theme.background,
        flex: 1,
        
    }}>

   <View style={[styles.header, { backgroundColor: 'transparent', paddingTop: Platform.OS == 'ios' ? 54: insets.top,}]}> 
             <View style={{
               // backgroundColor: 'blue',
               flexDirection: 'row',
               justifyContent: 'space-between',
              //  marginBottom: 15,
               paddingHorizontal: 20,
               paddingBottom: 24,
             }}>
                       <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: theme.border }]}>
                         <MaterialIcons name="chevron-left" size={22} color={theme.text} />
                       </Pressable>
               
                       <View style={styles.headerTitleWrap}>
                         <Text style={[styles.headerTitle, { color: theme.text }]}>Arena</Text>
                         <Text style={styles.headerSubtitle}>Galaxy Space</Text>
                       </View>
               
                       <View style={styles.headerSpacer} />
                       {/* <Pressable onPress={() => navigation.navigate('Inbox')} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
                         <MaterialIcons name="notifications-none" size={22} color={theme.text} />
                       </Pressable> */}
                     </View>
             <View/>
   
            
   
             
           </View>
    {/*Main Tabs........... "Community", Discover & Challenges */}
    <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 0,
        backgroundColor: 'transparent',
        paddingBottom: 20,
    }}>
    {ARENA_TABS.map((item)=>(
        <Pressable
        key={item}
        onPress={()=>setActiveTab(item)}
        style={{
            justifyContent: 'center',
            alignItems: 'center'
        }}>
        <Text style={{
            // color: activeTab == item ? theme.accent : theme.textSecondary,
            ...fontSize.b1,
            color: activeTab === item ? isDark ? '#ffffff': '#000000': isDark ? '#ffffff5d':'#0000005d',
            textTransform: 'capitalize',
            // // fontSize: fontSize.b1.fontSize,
            marginBottom: 5
        }}>
            {item}
        </Text>
        {activeTab === item && <View
        style={{
            height: 2,
            width: 50,
            backgroundColor: PRIMARY_COLOR,

        }}
        />}
        </Pressable>
    ))}
    </View>

    {activeTab == 'community' && <Community/>}
    {activeTab == 'discover' && <Discover embedded onHorizontalSwipeAreaTouchChange={setIsDiscoverSwipeAreaActive}/>}
    {activeTab == 'challenges' && <CreatorChallenges/>}
    </View>);
}

const createStyles = () => StyleSheet.create({
    header: { paddingBottom: 0, },
    headerTitle: {
        ...fontSize.h1,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    headerSubtitle: {
        ...fontSize.h2,
        color: PRIMARY_COLOR,
        marginTop: 4,
        // // ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    headerSpacer: {
        width: 40,
    },
    headerTitleWrap: {
        alignItems: 'center',
    },
    headerRoundBtn: {
        height: 40,
        width: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Arena;
