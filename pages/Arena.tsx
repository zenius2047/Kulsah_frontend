import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { View, Text, Pressable, Platform, StyleSheet, PanResponder } from 'react-native';
import { mediumScreen } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import Community, { COMMUNITY_UPDATE_COUNT } from './Community';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreatorChallenges, { CREATOR_CHALLENGE_UPDATE_COUNT } from './CreatorChallenges';
import Discover, { DISCOVER_UPDATE_COUNT } from './Discover';



import { fontSize } from '../typography';

type ArenaTab = 'community' | 'discover' | 'challenges';
const ARENA_TABS: ArenaTab[] = ['community', 'discover', 'challenges'];
const ARENA_UPDATE_COUNTS: Record<ArenaTab, number> = {
  community: COMMUNITY_UPDATE_COUNT,
  discover: DISCOVER_UPDATE_COUNT,
  challenges: CREATOR_CHALLENGE_UPDATE_COUNT,
};

const Arena :React.FC = ({route}:any)=>{
    const { isDark, theme } = useThemeMode();
    const [activeTab, setActiveTab] = useState<ArenaTab>('community');
    const [isDiscoverSwipeAreaActive, setIsDiscoverSwipeAreaActive] = useState(false);
    const [updateBadgeWidths, setUpdateBadgeWidths] = useState<Partial<Record<ArenaTab, number>>>({});
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
    {ARENA_TABS.map((item)=>{
      const isActive = activeTab === item;
      const updateCount = ARENA_UPDATE_COUNTS[item];

      return (
        <Pressable
        key={item}
        onPress={()=>setActiveTab(item)}
        style={[styles.tabButton,]}>
        <View style={{
          flexDirection: 'row'
        }}>
          <Text style={{
            // color: activeTab == item ? theme.accent : theme.textSecondary,
            ...fontSize.tabTextLarge,
            color: isActive ? isDark ? '#ffffff': '#000000': isDark ? '#ffffff5d':'#0000005d',
            textTransform: 'uppercase',
            // // fontSize: fontSize.b1.fontSize,
            marginBottom: 5
        }}>
            {item}
        </Text>
        <View
          onLayout={({ nativeEvent }) => {
            const badgeWidth = nativeEvent.layout.width;
            setUpdateBadgeWidths((currentWidths) =>
              currentWidths[item] === badgeWidth
                ? currentWidths
                : { ...currentWidths, [item]: badgeWidth }
            );
          }}
          style={[
            styles.updateBadge,
            {
              backgroundColor: isActive ? PRIMARY_COLOR : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              borderColor: isActive ? PRIMARY_COLOR : theme.border,
              marginTop: -5,
              marginLeft: 2.5
              // right: item === 'discover' ? 0 : -8,
            },
          ]}
        >
          <Text
            style={[
              styles.updateBadgeText,
              { color: isActive ? '#ffffff' : isDark ? '#ffffff99' : '#00000099' },
            ]}
          >
            {updateCount}
          </Text>
        </View>
        </View>
        {isActive && <View
        style={{
            height: 2,
            width: 50,
            backgroundColor: PRIMARY_COLOR,
            marginLeft: -(updateBadgeWidths[item] ?? 15)

        }}
        />}
        </Pressable>
      );
    })}
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
        // // ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    tabButton: {
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 92,
        paddingTop: 8,
        // position: 'relative',
    },
    updateBadge: {
        // position: 'absolute',
        // top: 0,
        
        minWidth: 15,
        height: 15,
        borderRadius: 999,
        // borderWidth: 1,
        paddingHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    updateBadgeText: {
        ...fontSize.badgeTextSmall,
        lineHeight: fontSize.b5.lineHeight,
    },
});

export default Arena;
