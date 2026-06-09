import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { View, Text, Pressable, Platform, StyleSheet, PanResponder } from 'react-native';
import { mediumScreen } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import Community from './Community';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreatorChallenges from './CreatorChallenges';



import { fontSize } from '../typography';

const Arena :React.FC = ({route}:any)=>{
    const { isDark, theme } = useThemeMode();
    const [activeTab, setActiveTab] = useState<string | "challenges" | "community">('community');
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const styles = useMemo(() => createStyles(), []);
    const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
    const swipeHandledRef = useRef(false);

    useEffect(()=>{
        const tabToRoute = route?.params?.tabToRoute;
        if(tabToRoute){
            setActiveTab(tabToRoute)
        }
    }, [route?.params?.tabToRoute])


     const handleTabSwipe = useCallback((direction: 'left' | 'right') => {
        const tabOrder: Array<'community' | 'challenges' | string> = ['community','challenges'];
    
        setActiveTab((currentTab) => {
          const currentIndex = tabOrder.indexOf(currentTab);
          if (currentIndex === -1) return currentTab;
    
          if (direction === 'left') {
            return tabOrder[Math.min(currentIndex + 1, tabOrder.length - 1)];
          }
    
          return tabOrder[Math.max(currentIndex - 1, 0)];
        });
      }, []);
    
      const panResponder = useMemo(
        () =>
          PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
              Math.abs(gestureState.dx) > 24 &&
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
        [handleTabSwipe]
      );
    

    return (
    <View
        {...panResponder.panHandlers}
        style={{
        backgroundColor: theme.background,
        flex: 1,
        paddingTop: Platform.OS == 'ios' ? 54: insets.top,
    }}>

   <View style={[styles.header, { backgroundColor: isDark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)', borderBottomColor: isDark ? '#27272a' : '#e2e8f0' }]}> 
             <View style={{
               // backgroundColor: 'blue',
               flexDirection: 'row',
               justifyContent: 'space-between',
               marginBottom: 15,
               paddingHorizontal: 20,
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
    {activeTab == 'challenges' && <CreatorChallenges/>}
    </View>);
}

const createStyles = () => StyleSheet.create({
    header: { paddingBottom: 0, borderBottomWidth: 1 },
    headerTitle: {
        ...fontSize.h1,
        letterSpacing: 2.2,
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
