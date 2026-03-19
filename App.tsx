import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, StatusBar, Dimensions , Image, useWindowDimensions} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons,} from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import ExploreIcon from './assets/icons/explore-svg.svg';
import LocalLibraryIcon from './assets/icons/local_library-svg.svg';
import MovieIcon from './assets/icons/movieIcon-svg.svg';
import HomeIcon from './assets/icons/home-svg.svg';
import ForumIcon from './assets/icons/forum-svg.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
// import MaterialSymbols from 'react-native-vector-icons/MaterialSymbolsOutlined';

// import Icon from 'react-native-vector-icons/MaterialIcons';

import { user, User, UserRole, setUser, setHeight, setWidth, setScreenType, mediumScreen, setSmallWith, darkMode } from './types';
import ArtistDashboard from './pages/ArtistDashboard';
import LiveStream from './pages/LiveStream';
import ChatView from './pages/ChatView';
import Feed from './pages/Feed';
import Discover from './pages/Discover';
import Onboarding from './pages/Onboarding';
import Signup from './pages/Signup';
import Community from './pages/Community';
import { BlurView } from 'expo-blur';
import ArtistProfile from './pages/ArtistProfile';
import FanProfile from './fanProfile';
import CreatorSettings from './pages/CreatorSettings';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UploadContent from './pages/UploadContent';
import Messages from './pages/Messages';
import FanSettings from './pages/FanSettings';
import FanLibrary from './pages/CreatorLibrary';
import GoLiveSetup from './pages/GoLiveSetup';
import CreatorEvents from './pages/CreatorEvents';
import CreatorAnalytics from './pages/CreatorAnalytics';
import CreatorLibrary from './pages/CreatorLibrary';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');


const TextWithDefaults = Text as unknown as { defaultProps?: { style?: unknown } };
TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
TextWithDefaults.defaultProps.style = [{ fontFamily: 'PlusJakartaSans' }, TextWithDefaults.defaultProps.style];




const PlaceholderScreen = ({ label }: { label: string }) => (
  <View style={styles.center}>
    <Text>{label}</Text>
  </View>
);

interface TabsProps {
  isDarkMode: boolean;
}

const VideoPlayer = () => <PlaceholderScreen label="Video Player" />;

const CreatorTabs = ({isDarkMode}: TabsProps) => (
  <Tab.Navigator 
  id="creator-tabs"
  screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#cd2bee',
      tabBarInactiveTintColor: '#8E8E93',
      // tabBarBackgroundColor: '#060913',
      tabBarStyle: [styles.tabBar, {backgroundColor: isDarkMode ?  '#ffffffd9':'#1f1022d4',}],
      tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
    }}
  >
    <Tab.Screen
      name="Feed"
      component={Feed}
      options={{
        tabBarIcon: ({ color, size }) => <MovieIcon width={size} height={size} fill={color} />,
      }}
    />
    <Tab.Screen
      name="Home"
      component={ArtistDashboard}
      options={{
        tabBarIcon: ({ color, size }) => <HomeIcon width={size} height={size} fill={color} />,
      }}
    />
    <Tab.Screen
      name="Library"
      component={CreatorLibrary}
      options={{
        tabBarIcon: ({ color, size }) => <LocalLibraryIcon width={size} height={size} fill={color} />,
      }}
    />
    <Tab.Screen 
    name="Inbox" 
    component={Messages}
    options = {{
      tabBarIcon: ({ color, size }) => <MaterialIcons name="chat-bubble-outline" size={size} color={color} />,
    }}
    />
    <Tab.Screen
      name="Profile"
      component={ArtistProfile}
      options={{
        tabBarIcon: ({ color, size }) => 
        <View
        style={{
          height: 30,
          width: 30,
          borderRadius: 15,
          backgroundColor: 'blue',
          justifyContent: 'center',
          alignItems:'center',
          padding: 1
        }}
        >
          <Image
          source={{uri:"https://picsum.photos/seed/user/100"}}
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            borderRadius: 15
          }}
          ></Image>
        </View>,
      }}
    />
  </Tab.Navigator>
);

const FanTabs = ({isDarkMode}: TabsProps) => (
  <Tab.Navigator
    id="fan-tabs"
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#cd2bee',
      tabBarInactiveTintColor: isDarkMode ? '#64748b':'#8E8E93',
      // tabBarBackgroundColor: '#060913',
      tabBarStyle: [styles.tabBar, {backgroundColor: isDarkMode ?  '#ffffff':'#1f1022',}],
      // tabBarBackground: () => (
      //     <BlurView
      //       intensity={10}
      //       tint="dark"
      //       style={StyleSheet.absoluteFill}
      //     />
      //   ),
    }}
  >
    <Tab.Screen
      name="Feed"
      component={Feed}
      options={{
        tabBarIcon: ({ color, size }) =>
          //  <MaterialIcons name="movie" size={size} color={color} />,
        // <Image 
        // source={require('./assets/icons/explore-big.png')} 
        // style= {{
        //   height: 24,
        //   tintColor: 'gold'
        //   // color: ""
        // }}
        
        // />
        <MovieIcon width={size} height={size} fill={color} />
      }}
    />
    <Tab.Screen 
    name="Discover" 
    component={Discover}
    options = {{
      tabBarIcon: ({ color, size }) =>
        //  <MaterialIcons name="explore" size={size} color={color} />,
      <ExploreIcon width={size} height={size} fill={color} />

    }}
    />
    <Tab.Screen 
    name="Community" 
    component={Community}
    options = {{
      tabBarIcon: ({ color, size }) => 
      // <MaterialIcons name="local-library" size={size} color={color} />,
      <ForumIcon width={size} height={size} fill={color} />
    }}
    />
    <Tab.Screen 
    name="Inbox" 
    component={Messages}
    options = {{
      tabBarIcon: ({ color, size }) => <MaterialIcons name="chat-bubble-outline" size={size} color={color} />,
    }}
    />
    <Tab.Screen
      name="Profile"
      component={FanProfile}
      options={{
        tabBarIcon: ({ color, size }) => <View
        style={{
          height: 30,
          width: 30,
          borderRadius: 15,
          backgroundColor: 'blue',
          justifyContent: 'center',
          alignItems:'center',
          padding: 1
        }}
        >
          <Image
          source={{uri:"https://picsum.photos/seed/user/100"}}
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            borderRadius: 15
          }}
          ></Image>
        </View>,
      }}
    />
  </Tab.Navigator>
);




const App: React.FC = () => {
  // const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { height: vh, width:vw } = useWindowDimensions();
  const [isDarkMode, setDarkMode] = useState(false);

  const [fontsLoaded] = useFonts({
      PlusJakartaSans:require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
      PlusJakartaSansBold:require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
      PlusJakartaSansExtraBold:require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
      PlusJakartaSansMedium:require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    });

  useEffect(()=>{
    setDarkMode(darkMode);
  },[darkMode])
  
    
  
  

  useEffect(() => {
    // console.log(`Rebuilding`)
    setHeight(vh);
    setWidth(vw);
    if(SCREEN_HEIGHT > 808 ){
      setScreenType(true)
    }
    if(SCREEN_WIDTH < 400){
      setSmallWith(true)
    }
    void loadInitialData();
  }, [user, vh]);

  const loadInitialData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('pulsar_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser) as User)
        setShowOnboarding(false)
      };
      console.log(savedUser)
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (role: UserRole) => {
    const mockUser: User = {
      id: role === 'creator' ? 'mila_ray_01' : 'alex_rivera_42',
      name: role === 'creator' ? 'Mila Ray' : 'Alex Rivera',
      role,
    };
    setUser(mockUser);
    setShowOnboarding(false);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(mockUser));
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if(!fontsLoaded){
    return null;
  }

  return (
    // <NavigationContainer>
    //           <StatusBar barStyle="light-content" backgroundColor="transparent" translucent = {true} />

    //   <Stack.Navigator id="root-stack" screenOptions={{ headerShown: false }}>
    //     <>
      
    //   {/* <FanTabs /> */}
    //   <Stack.Screen name="Message" component={ArtistDashboard} />
    //     </>
    //   </Stack.Navigator>
      
    // </NavigationContainer>
    <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView edges={[]} style={{ flex: 1 }}>

          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent = {true} />
      <Stack.Navigator id="root-stack" screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <>
            <Stack.Screen name="Onboarding">{() => <Onboarding onLogin={handleLogin} />}</Stack.Screen>
            <Stack.Screen name="Signup">{() => <Signup onLogin={handleLogin} />}</Stack.Screen>
          </>
        ) : user ? (
          <>
            <Stack.Screen name="MainTabs">{() => (user!.role === 'creator' ? <CreatorTabs isDarkMode={isDarkMode} /> : <FanTabs isDarkMode={isDarkMode} />)}</Stack.Screen>
            <Stack.Screen name="Chat" component={ChatView} />
            <Stack.Screen name="Settings" component={CreatorSettings} />
            <Stack.Screen name="ArtistProfile" component={ArtistProfile} />
            <Stack.Screen name="UploadContent" component={UploadContent} />
            <Stack.Screen name="FanSettings" component={FanSettings} />
            <Stack.Screen name="GoLive" component={GoLiveSetup} />
            <Stack.Screen name="CreatorEvents" component={CreatorEvents} />
            <Stack.Screen name="/creator/analytics" component={CreatorAnalytics} />
            <Stack.Screen name="CreatorAnalytics" component={CreatorAnalytics} />
            <Stack.Screen name="Community" component={Community} />
            <Stack.Screen name="Analytics" component={CreatorAnalytics} />
            
            
          </>
        ) : (
          <Stack.Screen name="Onboarding">{() => <Onboarding onLogin={handleLogin} />}</Stack.Screen>
        )}
      </Stack.Navigator>
        </SafeAreaView>
      

      
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  brandingContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
  },
  brandingText: {
    color: '#6200EE',
    fontWeight: '900',
    letterSpacing: 4,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    // backgroundColor: 'transparent',
    elevation: 0,
    height: '10%',
    fontSize: mediumScreen ? 12: 8,
    fontFamily: "PlusJakartaSans"
  },
});

export default App;
