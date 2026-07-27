import React, { useEffect, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha, KulsahDarkTheme, KulsahTheme } from './theme';
import { View, StyleSheet, ActivityIndicator, Text, TextInput, Pressable, StatusBar, Dimensions , Image, useWindowDimensions, Platform} from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons,} from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold
} from '@expo-google-fonts/poppins';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold
} from '@expo-google-fonts/plus-jakarta-sans'
import * as ExpoSplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import ExploreIcon from './assets/icons/explore-svg.svg';
// import LocalLibraryIcon from './assets/icons/local_library-svg.svg';
import MovieIcon from './assets/icons/movieIcon-svg.svg';
import HomeIcon from './assets/icons/home-svg.svg';
import ForumIcon from './assets/icons/forum-svg.svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from './src/lib/queryClient';
import { AuthProvider } from './src/context/AuthContext';
import { authApi, clearAuth, useAuthStore } from './src';
// import MaterialSymbols from 'react-native-vector-icons/MaterialSymbolsOutlined';

// import Icon from 'react-native-vector-icons/MaterialIcons';

import { user, User, UserRole, setUser, setHeight, setWidth, setScreenType, mediumScreen, setSmallWith, setDark, subscribeUser } from './types';
// import ArtistDashboard from './pages/ArtistDashboard';
// import LiveStream from './pages/LiveStream';
import ChatView from './pages/ChatView';
import Feed from './pages/Feed';
import Signup from './pages/Signup';
import Community from './pages/Community';
import { BlurView } from 'expo-blur';
import ArtistProfile from './pages/ArtistProfile';
import FanProfile from './pages/FanProfile';
import CreatorSettings from './pages/CreatorSettings';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UploadContent from './pages/UploadContent';
import Messages from './pages/Messages';
import FanSettings from './pages/FanSettings';
// import FanLibrary from './pages/CreatorLibrary';
import GoLiveSetup from './pages/GoLiveSetup';
import CreatorEvents from './pages/CreatorEvents';
import CreatorAnalytics from './pages/CreatorAnalytics';
import CreatorRevenue from './pages/CreatorRevenue';
import FanSubscriptions from './pages/FanSubscriptions';
import CreatorLibrary from './pages/CreatorLibrary';
import Challenges from './pages/Challenges';
import UseSound from './pages/UseSound';
import UseEffect from './pages/UseEffect';
import RecordContent from './pages/RecordContent';
import ChallengeEntry from './pages/challengeEntry';
import ParticipantHistory from './pages/ParticipantHistory';
import MyEntry from './pages/MyEntry';
import winner from './pages/winner';
import Arena from './pages/Arena';
import CreateEvent from './pages/CreateEvent';
import CreatorLiveStream from './pages/CreatorLiveStream';
import CreateChallenge from './pages/CreateChallenge';
import ChallengeDrafts from './pages/ChallengeDrafts';
import RevenueSplit from './pages/RevenueSplit';
import NoReward from './pages/NoReward';
import RewardConfig from './pages/RewardConfig';
import Reward from './pages/Reward';
import FinalStep from './pages/finalStep';
import ChallengeParticipants from './pages/ChallengeParticipants';
import FeedChallenge from './pages/FeedChallenge';
import Vote from './pages/SoundSelect';
import FanArena from './pages/FanArena';
import Library from './pages/Library';
import EditSubmission from './pages/EditSubmission';
import SubmitEntry from './pages/SubmitEntry';
import Player from './pages/Player';
import EventDetail from './pages/EventDetail';
import SelectTickets from './pages/SelectTickets';
import LiveFeed from './pages/LiveFeed';
import CollaborationHub from './pages/CollaborationHub';
import Inbox from './pages/Inbox';
import Notifications from './pages/Notifications';
import StreakReward from './pages/StreakReward';
import ClaimPrize from './pages/ClaimPrize';
import ErrorBoundary from './components/ErrorBoundary';
import CreateCommunityPost from './pages/CreateCommunityPost';
import CommunityPostDetail from './pages/CommunityPostDetail';
import MembershipTiers from './pages/MembershipTiers';
import Subscribers from './pages/Subscribers';
import SplashScreen from './pages/SplashScreen';
import GetStarted from './pages/GetStarted';
import SignupVibes from './pages/SignupVibes';
import SignUpModal from './SignUpModal';
import Login from './pages/Login';
import EmailPhone from './pages/EmailPhone';
import Store from './pages/Store';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import VibePicker from './pages/VibePicker';
import FanTicketDetail from './pages/FanTicketDetail';
import MarketPlace from './MarketPlace';
import TopUpCoins from './pages/TopUpCoins';
import ChallengeLeaderboard from './pages/ChallengeLeaderboard';
import Events from './pages/Events';
import TrendingVideos from './pages/TrendingVideos';
import Search from './pages/Search';
import Submissions from './pages/Submissions';
import Premium from './pages/Premium';
import PlaylistPlayer from './pages/PlaylistPlayer';
import HelpCentre from './pages/HelpCentre';
import TermsPolicies from './pages/TermsPolicies';
import PrivacyCentre from './pages/PrivacyCentre';



import { typographyStyles } from './fonts';
import { DEVICE_SIZE_CLASS, fontSize } from './typography';
import VideoPlayer from './pages/VideoPlayer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const navigationRef = createNavigationContainerRef();

void ExpoSplashScreen.preventAutoHideAsync();

const TextWithDefaults = Text as unknown as { defaultProps?: { allowFontScaling?: boolean; style?: unknown } };
TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
TextWithDefaults.defaultProps.allowFontScaling = false;
// Regression: unstyled text default -> body role, iOS 15pt / Android 14sp, native.
TextWithDefaults.defaultProps.style = [
  typographyStyles.body,
  { fontFamily: 'Inter_400Regular' },
  TextWithDefaults.defaultProps.style,
];

const TextInputWithDefaults = TextInput as unknown as { defaultProps?: { includeFontPadding?: boolean; style?: unknown } };
TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps || {};
TextInputWithDefaults.defaultProps.includeFontPadding = false;
TextInputWithDefaults.defaultProps.style = [
  // Regression: unstyled input text default -> body role, iOS 15pt / Android 14sp, native.
  typographyStyles.body,
  { fontFamily: 'Inter_400Regular' },
  TextInputWithDefaults.defaultProps.style,
];




const PlaceholderScreen = ({ label }: { label: string }) => (
  <View style={styles.center}>
    <Text>{label}</Text>
  </View>
);

interface TabsProps {
  isDarkMode: boolean;
  user: User;
  onTap?: ()=>void
}

type TabBarIconProps = {
  color: string;
  size: number;
  focused: boolean;
};

type TabScreenOptionsRoute = {
  name: string;
};

type TabListenerParams = {
  navigation: {
    getParent: () => { navigate: (screen: string) => void } | undefined;
  };
};

type TabPressEvent = {
  preventDefault: () => void;
};

const getTabBarShadow = (isDarkMode: boolean, isGalaxy: boolean) => ({
  borderTopWidth: 1,
  borderTopColor: isGalaxy
    ? 'rgba(255,255,255,0.08)'
    : isDarkMode
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(15,23,42,0.08)',
  shadowColor: isDarkMode || isGalaxy ? '#000000' : '#0f172a',
  shadowOpacity: isDarkMode || isGalaxy ? 0.42 : 0.16,
  shadowRadius: isDarkMode || isGalaxy ? 18 : 16,
  shadowOffset: { width: 0, height: -8 },
  elevation: isDarkMode || isGalaxy ? 18 : 12,
});

const CreatorTabs = ({ isDarkMode }: TabsProps) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = (Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.08 : SCREEN_HEIGHT * 0.07 +insets.bottom);

  return (
    <Tab.Navigator
    id="creator-tabs"
    safeAreaInsets={{ bottom: 0 }}
    screenOptions={({ route }: { route: TabScreenOptionsRoute }) => ({
        headerShown: false,
        tabBarActiveTintColor: route.name === 'Galaxy' ? '#ffffff' : isDarkMode ? '#ffffff' : '#000000',
        tabBarInactiveTintColor: '#8E8E93',
        sceneStyle: { backgroundColor: '#000' },
        tabBarLabelStyle:{
          transform: 'uppercase',
        },
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: route.name === 'Galaxy' ? '#000' : isDarkMode ? '#000' : '#ffffff',
            height: tabBarHeight,
          },
          getTabBarShadow(isDarkMode, route.name === 'Galaxy'),
        ],
      })}
    >
    <Tab.Screen
      name="Galaxy"
      component={Feed}
      options={{
        tabBarIcon: ({ color, size, focused }: TabBarIconProps) =>
          focused ? (
            <MaterialIcons name="movie" size={size} color='white' />
          ) : (
            <MovieIcon width={size} height={size} fill={color} />
          ),
      }}
    />
    <Tab.Screen
      name="Arena"
      component={Arena}
      options={{
        tabBarIcon: ({ color, size, focused }: TabBarIconProps) =>
        focused ? (
          <MaterialIcons name="explore" size={size} color={color} />
        ) : (
          <ExploreIcon width={size} height={size} fill={color} />
        )
      }}
    />
    <Tab.Screen
      name=" "
      component={RecordContent}
      listeners={({ navigation }: TabListenerParams) => ({
        tabPress: (e: TabPressEvent) => {
          e.preventDefault();
          navigation.getParent()?.navigate('RecordContent');
        },
      })}
      options={{
        tabBarIcon: () => (
          <View style={styles.creatorCreatePlusPlate}>
                  <View style={styles.creatorCreatePlusVertical} />
                  <View style={styles.creatorCreatePlusHorizontal} />
                </View>
          // <View style={styles.creatorCreateTabOuter}>
          //   <View style={styles.creatorCreateGlow} />
          //   <LinearGradient
          //     colors={['#ff4fd8', PRIMARY_COLOR, '#4f46e5']}
          //     start={{ x: 0.06, y: 0 }}
          //     end={{ x: 1, y: 1 }}
          //     style={styles.creatorCreateButton}
          //   >
          //     <View style={styles.creatorCreateInner}>
          //       <View style={styles.creatorCreateHalo} />
                
          //       <View style={[styles.creatorCreateCorner, styles.creatorCreateCornerTop]} />
          //       <View style={[styles.creatorCreateCorner, styles.creatorCreateCornerBottom]} />
          //     </View>
          //   </LinearGradient>
          // </View>
        ),
      }}
    />
    <Tab.Screen
    name="Signal"
    component={Inbox}
    options = {{
      tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
        <MaterialIcons
          name={focused ? 'chat-bubble' : 'chat-bubble-outline'}
          size={size}
          color={color}
        />
      ),

    }}
    />
    <Tab.Screen
      name="Profile"
      component={ArtistProfile}
      initialParams={{
        isOwner: true,
        handle: user?.handle,
      }}
      options={{
        tabBarIcon: ({ color, size }: Omit<TabBarIconProps, 'focused'>) =>
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
};

const FanTabs = ({isDarkMode, user, onTap}: TabsProps) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = (Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.08 : SCREEN_HEIGHT * 0.07 +insets.bottom);

  const guardGuestTab = (e: TabPressEvent) => {
    if (user.role !== 'guest' && user.name !== 'guest') return;
    e.preventDefault();
    onTap?.();
  };

  return (
    <Tab.Navigator
      id="fan-tabs"
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={({ route }: { route: TabScreenOptionsRoute }) => ({
        headerShown: false,
        tabBarActiveTintColor: route.name === 'Galaxy' ? '#ffffff' : isDarkMode ? '#ffffff' : '#000000',
        tabBarInactiveTintColor: isDarkMode ? '#8E8E93' : '#64748b',
        sceneStyle: { backgroundColor: '#000' },
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: route.name === 'Galaxy' ? '#000' : isDarkMode ? '#0a050d' : '#ffffff',
            height: tabBarHeight,
          },
          getTabBarShadow(isDarkMode, route.name === 'Galaxy'),
        ],
      })}
    >
    <Tab.Screen
      name="Galaxy"
      component={Feed}
      options={{
        tabBarIcon: ({ color, size, focused }: TabBarIconProps) =>
          focused ? (
            <MaterialIcons name="movie" size={size} color='white' />
          ) : (
            <MovieIcon width={size} height={size} fill={color} />
          ),
      }}
    />
    <Tab.Screen
    name="Discover"
    component={FanArena}
    options = {{
      // tabBarLabel: '',
      tabBarIcon: ({ color, size, focused }: TabBarIconProps) =>
        focused ? (
          <MaterialIcons name="explore" size={size} color={color} />
        ) : (
          <ExploreIcon width={size} height={size} fill={color} />
        )
    }}
    listeners={{ tabPress: guardGuestTab }}
    />
    <Tab.Screen
    name="Community"
    component={Community}
    options = {{
      tabBarIcon: ({ color, size, focused }: TabBarIconProps) =>
        focused ? (
          <MaterialIcons name="forum" size={size} color={color} />
        ) : (
          <ForumIcon width={size} height={size} fill={color} />
        )
    }}
    listeners={{ tabPress: guardGuestTab }}
    />
    <Tab.Screen
    name="Signal"
    component={Inbox}
    options = {{
      tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
        <MaterialIcons
          name={focused ? 'chat-bubble' : 'chat-bubble-outline'}
          size={size}
          color={color}
        />
      ),
    }}
    listeners={{ tabPress: guardGuestTab }}
    />
    <Tab.Screen
      name="Profile"
      component={FanProfile}
      options={{
        tabBarIcon: ({ color, size }: Omit<TabBarIconProps, 'focused'>) => <View
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
      listeners={{ tabPress: guardGuestTab }}
    />
    </Tab.Navigator>
  );
};




const App: React.FC = () => {
  const { isDark } = useThemeMode();
  const paperTheme = isDark ? KulsahDarkTheme : KulsahTheme;
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [isBooting, setIsBooting] = useState(true);
  const { height: vh, width:vw } = useWindowDimensions();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    console.log('[Device]', {
      phoneType: DEVICE_SIZE_CLASS,
      platform: Platform.OS,
      screenWidth: SCREEN_WIDTH,
      screenHeight: SCREEN_HEIGHT,
    });
  }, []);


  const onTap = () => {
    setVisible(true);
  }


  const [fontsLoaded, fontError] = useFonts({
      ...MaterialIcons.font,
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
      DMSans_400Regular,
      DMSans_500Medium,
      DMSans_600SemiBold,
      DMSans_700Bold,
      Poppins_500Medium,
      Poppins_600SemiBold,
      Poppins_700Bold,
      Poppins_800ExtraBold,
      PlusJakartaSans_500Medium,      
      PlusJakartaSans_600SemiBold,
      PlusJakartaSans_700Bold,
      PlusJakartaSans_800ExtraBold,
      'Pogonia_500Medium': require('./assets/fonts/pogonia-medium.ttf'),
      'Pogonia_600SemiBold': require('./assets/fonts/pogonia-semibold.ttf'),
      'Pogonia_700Bold': require('./assets/fonts/pogonia-bold.ttf'),
    });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setHeight(vh);
    setWidth(vw);
    setScreenType(SCREEN_HEIGHT > 880);
    setSmallWith(SCREEN_WIDTH < 400);
  }, [vh, vw]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeUser(setCurrentUser);
    return unsubscribe;
  }, []);

  const loadInitialData = async () => {
    try {
      await useAuthStore.persist.rehydrate();

      const [savedUser, savedDarkMode] = await Promise.all([
        AsyncStorage.getItem('pulsar_user'),
        AsyncStorage.getItem('pulsar_dark_mode'),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);

      if (savedDarkMode !== null) {
        setDark(JSON.parse(savedDarkMode));
      }

      const persistedAuthUser = useAuthStore.getState().user;

      if (persistedAuthUser) {
        setUser(persistedAuthUser);
        setCurrentUser(persistedAuthUser);
        await AsyncStorage.setItem('pulsar_user', JSON.stringify(persistedAuthUser));
      } else if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        setCurrentUser(parsedUser);
      } else {
        setUser(null);
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBooting(false);
    }
  };

  const handleLogin = async (role: UserRole) => {
    const mockUser: User = {
      id: role === 'creator' ? 1 : 2,
      name: role === 'creator' ? 'Mila Ray' : 'Alex Rivera',
      role,
      email: role === 'creator' ? 'mila@kulsah.com' : 'alex@kulsah.com',
      handle: role === 'creator' ? 'mila_ray_01' : 'alex_rivera_42',
    };
    setUser(mockUser);
    setCurrentUser(mockUser);
    await AsyncStorage.setItem('pulsar_user', JSON.stringify(mockUser));
  };

  const handleLogout = async () => {
    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await authApi.logout(token);
      } catch (error) {
        console.warn('Logout request failed, clearing local auth anyway.', error);
      }
    }

    await AsyncStorage.removeItem('pulsar_user');
    clearAuth();
    setUser(null);
    setCurrentUser(null);

    requestAnimationFrame(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'GetStarted' as never }],
        });
      }
    });
  };

  if(!fontsLoaded && !fontError){
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PaperProvider theme={paperTheme}>
          <SafeAreaProvider>
            <ErrorBoundary
              fallbackTitle="App error"
              fallbackMessage="An unexpected error occurred. Retry to reload the app."
            >
              <NavigationContainer ref={navigationRef}>
                <SafeAreaView edges={Platform.OS === 'ios'? []: []} style={{ flex: 1 }}>

            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent = {true} />
            <Stack.Navigator id="root-stack" screenOptions={{ headerShown: false }}>
              {isBooting ? (
                <>
                  <Stack.Screen name="Splash" component={SplashScreen} />
                </>
              ) : currentUser ? (
                <>
                  <Stack.Screen name="MainTabs">{() => (currentUser.role === 'creator' ? <CreatorTabs isDarkMode={isDark} user={currentUser} /> : <FanTabs isDarkMode={isDark} user={currentUser} onTap={onTap} />)}</Stack.Screen>
                  <Stack.Screen name="Login">{() => <Login onLogin={handleLogin} />}</Stack.Screen>
                  <Stack.Screen
                    name="EmailPhone"
                    component={EmailPhone}
                    options={{ gestureEnabled: false }}
                  />
                  <Stack.Screen name="EmailVerification" component={EmailVerification} />
                  <Stack.Screen name="VerifyOtp" component={VerifyOtp} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                  <Stack.Screen name="ResetPassword" component={ResetPassword} />
                  <Stack.Screen name="Chat" component={ChatView} />
                  <Stack.Screen name="Settings">{() => <CreatorSettings onLogout={handleLogout} />}</Stack.Screen>
                  <Stack.Screen name="MembershipTiers" component={MembershipTiers} />
                  <Stack.Screen name="ArtistProfile" component={ArtistProfile} />
                  <Stack.Screen name="UploadContent" component={UploadContent} />
                  <Stack.Screen name="FanSettings">{() => <FanSettings onLogout={handleLogout} />}</Stack.Screen>
                  <Stack.Screen name="GoLive" component={GoLiveSetup} />
                  <Stack.Screen name="CreatorEvents" component={CreatorEvents} />
                  <Stack.Screen name="/creator/analytics" component={CreatorAnalytics} />
                  <Stack.Screen name="CreatorAnalytics" component={CreatorAnalytics} />
                  <Stack.Screen name="CreatorRevenue" component={CreatorRevenue} />
                  <Stack.Screen name="FanSubscriptions" component={FanSubscriptions} />
                  <Stack.Screen name="Community" component={Community} />
                  <Stack.Screen name="Analytics" component={CreatorAnalytics} />
                  <Stack.Screen name="Subscribers" component={Subscribers} />
                  <Stack.Screen name="Challenges" component={Challenges} />
                  <Stack.Screen name="RecordContent" component={RecordContent}/>
                  <Stack.Screen name="CreateContent" component={CreateEvent}/>
                  <Stack.Screen name="CreatorLiveStream" component={CreatorLiveStream}/>
                  <Stack.Screen name="CreateChallenge" component={CreateChallenge}/>
                  <Stack.Screen name="ChallengeDrafts" component={ChallengeDrafts}/>
                  <Stack.Screen name="RevenueSplit" component={RevenueSplit}/>
                  <Stack.Screen name="NoReward" component={NoReward}/>
                  <Stack.Screen name="RewardConfig" component={RewardConfig}/>
                  <Stack.Screen name="Reward" component={Reward}/>
                  <Stack.Screen name="finalStep" component={FinalStep}/>
                  <Stack.Screen name="challengeParticipants" component={ChallengeParticipants}/>
                  <Stack.Screen name="ChallengeFeed" component={FeedChallenge}/>
                  <Stack.Screen name="Vote" component={Vote}/>
                  <Stack.Screen name="Video" component={Player}/>
                  <Stack.Screen name="EventDetail" component={EventDetail}/>
                  <Stack.Screen name="SelectTickets" component={SelectTickets}/>
                  <Stack.Screen name="ChallengeEntry" component={ChallengeEntry}/>
                  <Stack.Screen name= "Library" component={Library}/>
                  <Stack.Screen name= "EditSubmission" component={EditSubmission}/>
                  <Stack.Screen name= "SubmitEntry" component={SubmitEntry}/>
                  <Stack.Screen name= "Livefeed" component={LiveFeed}/>
                  <Stack.Screen name= "ConnectHub" component={CollaborationHub}/>
                  <Stack.Screen name= "Notification" component={Notifications}/>
                  <Stack.Screen name= "StreakReward" component={StreakReward}/>
                  <Stack.Screen name= "ClaimPrize" component={ClaimPrize}/>
                  <Stack.Screen name= "CommunityPost" component={CreateCommunityPost}/>
                  <Stack.Screen name= "CommunityPostDetail" component={CommunityPostDetail}/>
                  <Stack.Screen name= "MarketPlace" component={MarketPlace}/>
                  <Stack.Screen name= "UseSound" component={UseSound}/>
                  <Stack.Screen name= "UseEffect" component={UseEffect}/>
                  <Stack.Screen name= "VibePicker" component={VibePicker}/>
                  <Stack.Screen name= "FanTicket" component={FanTicketDetail}/>
                  <Stack.Screen name="TopUpCoins" component={TopUpCoins} />
                  <Stack.Screen name="ChallengeLeaderboard" component={ChallengeLeaderboard}/>
                  <Stack.Screen name="Events" component={Events}/>
                  <Stack.Screen name="TrendingVideos" component={TrendingVideos}/>
                  <Stack.Screen name="Search" component={Search}/>
                  <Stack.Screen name="Submissions" component={Submissions}/>
                  <Stack.Screen name="Premium" component={Premium}/>
                  <Stack.Screen name="VideoPlayer" component={VideoPlayer}/>
                  <Stack.Screen name="PlaylistPlayer" component={PlaylistPlayer}/>
                  <Stack.Screen name="HelpCentre" component={HelpCentre}/>
                  <Stack.Screen name="TermsPolicies" component={TermsPolicies}/>
                  <Stack.Screen name="PrivacyCentre" component={PrivacyCentre}/>
                  <Stack.Screen name="VibeSignature" component={VibePicker}/>
                  {/* <Stack.Screen name="GetStarted" component={GetStarted} /> */}
                </>
              ) : (
                <>
                  <Stack.Screen name="GetStarted" component={GetStarted} />
                  <Stack.Screen name="/vibe-picker" component={SignupVibes} />
                  {/* <Stack.Screen name="Signup">{() => <Signup onLogin={handleLogin} />}</Stack.Screen> */}
                  <Stack.Screen
                    name="EmailPhone"
                    component={EmailPhone}
                    options={{ gestureEnabled: false }}
                  />
                  <Stack.Screen name="EmailVerification" component={EmailVerification} />
                  <Stack.Screen name="VerifyOtp" component={VerifyOtp} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                  <Stack.Screen name="ResetPassword" component={ResetPassword} />
                </>
              )}
            </Stack.Navigator>
            <SignUpModal
              visible={visible}
              isGuest={currentUser?.role === 'guest' || currentUser?.name === 'guest'}
              onClose={() => setVisible(false)}
              onCreateAccount={() => {
                setVisible(false);
                requestAnimationFrame(() => {
                  if (navigationRef.isReady()) {
                    navigationRef.navigate('EmailPhone' as never);
                  }
                });
              }}
            />
                </SafeAreaView>
              </NavigationContainer>
            </ErrorBoundary>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'black'
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
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 0,
    height: SCREEN_HEIGHT * 0.08,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    // backgroundColor: 'blue',
    transform : 'uppercase'
  },
  creatorCreateTabOuter: {
    width: 66,
    height: 66,
    marginBottom: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorCreateGlow: {
    position: 'absolute',
    width: 70,
    height: 48,
    borderRadius: 24,
    backgroundColor: primaryColorAlpha(0.34),
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.72,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  creatorCreateButton: {
    width: 64,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.44,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  creatorCreateInner: {
    width: 52,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(12,9,32,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  creatorCreateHalo: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  creatorCreatePlusPlate: {
    width: 48,
    height: 48,
    borderRadius: 99,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginTop: 25,
  },
  creatorCreatePlusVertical: {
    position: 'absolute',
    width: 5,
    height: 17,
    borderRadius: 3,
    backgroundColor: PRIMARY_COLOR,
  },
  creatorCreatePlusHorizontal: {
    position: 'absolute',
    width: 17,
    height: 5,
    borderRadius: 3,
    backgroundColor: PRIMARY_COLOR,
  },
  creatorCreateCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: 'rgba(255,255,255,0.88)',
  },
  creatorCreateCornerTop: {
    top: 7,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  creatorCreateCornerBottom: {
    right: 8,
    bottom: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderBottomRightRadius: 4,
  },
});

export default App;



