import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { View, Text, Pressable, Platform, StyleSheet, PanResponder } from 'react-native';
import { mediumScreen } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
const ARENA_TAB_ICONS: Record<ArenaTab, keyof typeof MaterialIcons.glyphMap> = {
  community: 'forum',
  discover: 'explore',
  challenges: 'emoji-events',
};

const Arena :React.FC = ({route}:any)=>{
    const { isDark, theme } = useThemeMode();
    const [activeTab, setActiveTab] = useState<ArenaTab>('community');
    const [isDiscoverSwipeAreaActive, setIsDiscoverSwipeAreaActive] = useState(false);
    const [updateCounts, setUpdateCounts] = useState<Record<ArenaTab, number>>(ARENA_UPDATE_COUNTS);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(), []);
    const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
    const swipeHandledRef = useRef(false);
    const setCommunityCount = useCallback((count: number) => setUpdateCounts((current) => ({ ...current, community: count })), []);
    const setDiscoverCount = useCallback((count: number) => setUpdateCounts((current) => ({ ...current, discover: count })), []);

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
               justifyContent: 'center',
              //  marginBottom: 15,
              //  paddingHorizontal: 20,
               paddingBottom: 24,
             }}>
                       {/* <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: theme.border }]}>
                         <MaterialIcons name="chevron-left" size={22} color={theme.text} />
                       </Pressable> */}
               
                       <View style={styles.headerTitleWrap}>
                         <Text style={[styles.headerTitle, { color: theme.text }]}>Arena</Text>
                         <Text style={styles.headerSubtitle}>Galaxy Space</Text>
                       </View>
               
                       {/* <View style={styles.headerSpacer} /> */}
                       {/* <Pressable onPress={() => navigation.navigate('Inbox')} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
                         <MaterialIcons name="notifications-none" size={22} color={theme.text} />
                       </Pressable> */}
                     </View>
             <View/>
   
            
   
             
           </View>
    <View style={styles.contentShell}>
      {activeTab === 'community' && <Community onCountChange={setCommunityCount}/>}
      {activeTab === 'discover' && <Discover embedded onCountChange={setDiscoverCount} onHorizontalSwipeAreaTouchChange={setIsDiscoverSwipeAreaActive}/>}
      {activeTab === 'challenges' && <CreatorChallenges/>}
    </View>

    <BlurView intensity={Platform.OS === 'android' ? 90 : 55} tint={isDark ? 'dark' : 'light'} style={[styles.floatingNav, {
      bottom: Math.max(insets.bottom, 12) + 10,
      backgroundColor: isDark ? 'rgba(28,28,32,0.78)' : 'rgba(250,250,252,0.8)',
      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.82)',
    }]}>
      {ARENA_TABS.map((item) => {
        const isActive = activeTab === item;
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item}
            onPress={() => setActiveTab(item)}
            style={[styles.floatingTab, isActive && { backgroundColor: isDark ? primaryColorAlpha(0.22) : primaryColorAlpha(0.12) }]}
          >
            <View style={styles.floatingIconWrap}>
              <MaterialIcons name={ARENA_TAB_ICONS[item]} size={isActive ? 24 : 23} color={isActive ? PRIMARY_COLOR : isDark ? '#b4b4bb' : '#62636a'} />
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>{updateCounts[item]}</Text>
              </View>
            </View>
            <Text style={[styles.floatingLabel, { color: isActive ? PRIMARY_COLOR : isDark ? '#9ca3af' : '#64748b' }]}>{item}</Text>
          </Pressable>
        );
      })}
    </BlurView>
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
    contentShell: { flex: 1 },
    floatingNav: {
      position: 'absolute', left: 14, right: 14, height: 68, borderRadius: 34, overflow: 'hidden',
      borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
      paddingHorizontal: 7, paddingVertical: 7, zIndex: 50, elevation: 12, shadowColor: '#000', shadowOpacity: 0.16,
      shadowRadius: 16, shadowOffset: { width: 0, height: 7 },
    },
    floatingTab: { flex: 1, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', gap: 1 },
    floatingIconWrap: { width: 38, height: 31, alignItems: 'center', justifyContent: 'center' },
    floatingBadge: { position: 'absolute', top: -3, right: -5, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
    floatingBadgeText: { color: '#fff', ...fontSize.badgeTextSmall, lineHeight: 11 },
    floatingLabel: { ...fontSize.b5, lineHeight: 13, textTransform: 'capitalize' },
});

export default Arena;
